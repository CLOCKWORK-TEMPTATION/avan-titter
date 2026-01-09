/**
 * @class ProjectManager
 * @description إدارة المشاريع والقوالب
 */
export class ProjectManager {
  private projects: Array<{
    id: string;
    name: string;
    createdAt: Date;
    lastModified: Date;
  }> = [];
  private templates: Array<{ id: string; name: string; content: string }> = [];

  createProject(name: string) {
    const project = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    this.projects.push(project);
    return project;
  }

  getProjects() {
    return [...this.projects];
  }

  getProject(id: string) {
    return this.projects.find((p) => p.id === id);
  }

  updateProject(id: string, updates: Partial<{ name: string }>) {
    const project = this.projects.find((p) => p.id === id);
    if (project) {
      Object.assign(project, updates, { lastModified: new Date() });
    }
    return project;
  }

  deleteProject(id: string) {
    this.projects = this.projects.filter((p) => p.id !== id);
  }

  addTemplate(name: string, content: string) {
    const template = {
      id: Date.now().toString(),
      name,
      content,
    };
    this.templates.push(template);
    return template;
  }

  getTemplates() {
    return [...this.templates];
  }
}
