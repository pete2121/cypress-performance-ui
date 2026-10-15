import BasePage from "../BasePage";

// One AER section. URL: /maritime/tasks/<taskId>/aer/<path>
// Sections open one by one. A locked section goes back to the task list.
export default class AerSectionPage extends BasePage {
  constructor({ path, ...rest }) {
    super(rest);
    this.path = path;
  }

  url(taskId, subPath = this.path) {
    return `/maritime/tasks/${taskId}/aer/${subPath}`;
  }

  open(taskId) {
    return this.visitAndMeasure(this.url(taskId));
  }
}
