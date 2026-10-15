class OperatorInvitationApi {
  toMillis(value) {
    if (value === undefined || value === null) {
      return 0;
    }

    const str = String(value).trim();
    if (!str) {
      return 0;
    }

    const parsed = Date.parse(str);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const asNumber = Number(str);
    if (!Number.isNaN(asNumber)) {
      return asNumber;
    }

    return 0;
  }

  decodeHtml(rawText) {
    return Cypress.$("<textarea />").html(String(rawText || "")).text();
  }

  collectTextFragments(value) {
    if (value === undefined || value === null) {
      return [];
    }

    if (typeof value === "string") {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => this.collectTextFragments(item));
    }

    if (typeof value === "object") {
      return Object.values(value).flatMap((item) => this.collectTextFragments(item));
    }

    return [String(value)];
  }

  extractInvitationToken(rawValue) {
    const tokenPattern = /registration\/invitation\?token=([^"'\s<>&)]+)/;
    const encodedTokenPattern = /registration%2Finvitation%3Ftoken%3D([^"'\s<>&)]+)/;

    const fragments = this.collectTextFragments(rawValue);

    for (const fragment of fragments) {
      const decoded = this.decodeHtml(fragment);
      let urlDecoded = decoded;

      try {
        urlDecoded = decodeURIComponent(decoded);
      } catch (_error) {
        urlDecoded = decoded;
      }

      const candidateMatchers = [
        decoded.match(tokenPattern),
        urlDecoded.match(tokenPattern),
        decoded.match(encodedTokenPattern)
      ];

      for (const match of candidateMatchers) {
        const candidateToken = match && match[1] ? String(match[1]).trim() : "";
        if (candidateToken.split(".").length === 3 && candidateToken.length > 100) {
          return candidateToken;
        }
      }
    }

    return null;
  }

  getAuthHeaders() {
    const username = Cypress.env("mailpitUsername");
    const password = Cypress.env("mailpitPassword");
    const basic = Cypress.Buffer.from(`${username}:${password}`, "utf8").toString("base64");

    return {
      Authorization: `Basic ${basic}`,
      Accept: "application/json, text/html, */*"
    };
  }

  findCurrentInvitationToken({ accountId, startedAtMillis, expectedRecipient, timeoutMs = 50000, pollIntervalMs = 2000 }) {
    const apiBase = Cypress.env("mailpitApiBaseUrl") || `${Cypress.config("baseUrl")}/mailpit/api/v1`;
    const headers = this.getAuthHeaders();
    const deadline = Date.now() + timeoutMs;
    const recipientText = String(expectedRecipient || "").toLowerCase();
    const startedAt = Number(startedAtMillis || Date.now());

    const scanCandidateAt = (candidates, index) => {
      if (index >= candidates.length) {
        return cy.wrap(null, { log: false });
      }

      const entry = candidates[index];
      const id = entry.msg.ID || entry.msg.Id || entry.msg.id;

      if (!id) {
        return scanCandidateAt(candidates, index + 1);
      }

      if (entry.millis > 0 && entry.millis < startedAt - 10000) {
        return scanCandidateAt(candidates, index + 1);
      }

      if (recipientText) {
        const recipientSource = JSON.stringify(entry.msg || {}).toLowerCase();
        if (!recipientSource.includes(recipientText)) {
          return scanCandidateAt(candidates, index + 1);
        }
      }

      return cy
        .request({
          method: "GET",
          url: `${apiBase}/message/${encodeURIComponent(String(id))}`,
          headers,
          failOnStatusCode: false
        })
        .then((messageResponse) => {
          if (messageResponse.status < 200 || messageResponse.status >= 300) {
            return scanCandidateAt(candidates, index + 1);
          }

          const token = this.extractInvitationToken(messageResponse.body);
          if (token) {
            return {
              token,
              mailId: String(id),
              created: entry.raw
            };
          }

          return scanCandidateAt(candidates, index + 1);
        });
    };

    const poll = () => {
      if (Date.now() >= deadline) {
        throw new Error(`Current invitation token not found after polling. accountId=${accountId || ""}`);
      }

      return cy
        .request({
          method: "GET",
          url: `${apiBase}/messages`,
          headers,
          failOnStatusCode: false
        })
        .then((listResponse) => {
          if (listResponse.status < 200 || listResponse.status >= 300) {
            cy.wait(pollIntervalMs, { log: false });
            return poll();
          }

          const payload = listResponse.body || {};
          const messages = payload.messages || payload.Messages || [];
          const candidates = messages
            .map((msg) => {
              const createdRaw =
                msg.Created ||
                msg.created ||
                msg.Date ||
                msg.date ||
                msg.Received ||
                msg.received;

              return {
                msg,
                raw: createdRaw,
                millis: this.toMillis(createdRaw)
              };
            })
            .sort((a, b) => b.millis - a.millis)
            .slice(0, 50);

          return scanCandidateAt(candidates, 0).then((found) => {
            if (found) {
              Cypress.env("invitationToken", found.token);
              Cypress.log({
                name: "invitation-poll",
                message: `token found accountId=${accountId || ""}, mailId=${found.mailId}, created=${found.created || ""}`
              });
              return found.token;
            }

            cy.wait(pollIntervalMs, { log: false });
            return poll();
          });
        });
    };

    return poll();
  }

  approveInvitation(token) {
    const invitationToken = token || Cypress.env("invitationToken");

    if (!invitationToken) {
      cy.log("Missing invitation token. Set Cypress.env('invitationToken') to approve the invitation.");
      return cy.wrap(null);
    }

    return cy.request({
      method: "POST",
      url: "/maritime/api/v1.0/operator-users/registration/accept-invitation",
      body: { token: invitationToken }
    });
  }

  openInvitationLink(token) {
    const invitationToken = token || Cypress.env("invitationToken");

    if (!invitationToken) {
      return cy.wrap(null);
    }

    return cy.request({
      method: "GET",
      url: "/maritime/registration/invitation",
      qs: { token: invitationToken },
      failOnStatusCode: false
    });
  }

  // For a new operator: set the password and make the user active.
  registerInvitedOperator({ firstName, lastName, password }, token) {
    const invitationToken = token || Cypress.env("invitationToken");

    if (!invitationToken) {
      throw new Error("Missing invitation token for registerInvitedOperator");
    }

    return cy.request({
      method: "PUT",
      url: "/maritime/api/v1.0/operator-users/registration/accept-authority-and-enable-invited-operator-with-credentials",
      body: {
        emailToken: invitationToken,
        firstName,
        lastName,
        phoneNumber: { countryCode: "30", number: "6976339678" },
        mobileNumber: { countryCode: "30", number: "6976339678" },
        password
      }
    });
  }

  approveCurrentInvitation({
    accountId,
    startedAtMillis,
    expectedRecipient,
    initialDelayMs = 10000,
    timeoutMs = 70000,
    pollIntervalMs = 2500,
    afterTokenDelayMs = 2000
  }) {
    return cy
      .wait(initialDelayMs)
      .then(() => {
        return this.findCurrentInvitationToken({
          accountId,
          startedAtMillis,
          expectedRecipient,
          timeoutMs,
          pollIntervalMs
        });
      })
      .then((token) => {
        return this.openInvitationLink(token)
          .then(() => cy.wait(afterTokenDelayMs, { log: false }))
          .then(() => this.approveInvitation(token));
      });
  }
}

export default new OperatorInvitationApi();