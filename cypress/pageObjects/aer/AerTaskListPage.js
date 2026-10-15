import BasePage from "../BasePage";

// The AER task list page.
class AerTaskListPage extends BasePage {
  constructor() {
    super({ heading: /complete \d{4} emissions report/i, metricName: "AER task list" });
  }

  open(taskId) {
    return this.visitAndMeasure(`/maritime/tasks/${taskId}`);
  }

  // The status next to a section, for example "Completed".
  sectionTag(sectionName) {
    return cy.contains("main li.app-task-list__item a", sectionName, { timeout: 30000 })
      .closest("li.app-task-list__item")
      .find(".app-task-list__tag");
  }

  sectionStatus(sectionName) {
    return this.sectionTag(sectionName).invoke("text").then((text) => text.trim());
  }

  assertSectionStatus(sectionName, status) {
    return this.sectionTag(sectionName).should(($tag) => {
      expect($tag.text().trim(), `${sectionName} status`).to.match(new RegExp(`^${status}$`, "i"));
    });
  }
}

export default new AerTaskListPage();
