/**
 * @class CollaborationSystem
 * @description نظام التعاون بين المستخدمين والتعليقات
 */
export class CollaborationSystem {
  private collaborators: Array<{ id: string; name: string; color: string }> = [];
  private comments: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: Date;
    position: any;
  }> = [];
  private changeCallbacks: Array<(data: any) => void> = [];

  addCollaborator(id: string, name: string, color: string) {
    this.collaborators.push({ id, name, color });
    this.notifyChange({ type: "collaborator_added", id, name, color });
  }

  removeCollaborator(id: string) {
    this.collaborators = this.collaborators.filter((c) => c.id !== id);
    this.notifyChange({ type: "collaborator_removed", id });
  }

  addComment(content: string, author: string, position: any) {
    const comment = {
      id: Date.now().toString(),
      content,
      author,
      timestamp: new Date(),
      position,
    };
    this.comments.push(comment);
    this.notifyChange({ type: "comment_added", comment });
    return comment;
  }

  getComments() {
    return [...this.comments];
  }

  getCollaborators() {
    return [...this.collaborators];
  }

  onChange(callback: (data: any) => void) {
    this.changeCallbacks.push(callback);
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyChange(data: any) {
    this.changeCallbacks.forEach((callback) => callback(data));
  }
}
