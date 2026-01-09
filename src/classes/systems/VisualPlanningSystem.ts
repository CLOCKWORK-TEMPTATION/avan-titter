/**
 * @class VisualPlanningSystem
 * @description نظام التخطيط البصري مع Storyboards و Beat Sheets
 */
export class VisualPlanningSystem {
  private storyboards: Array<{
    id: string;
    sceneId: string;
    description: string;
    imageUrl?: string;
  }> = [];
  private beatSheets: Array<{
    id: string;
    act: number;
    beat: string;
    description: string;
  }> = [];

  addStoryboard(sceneId: string, description: string, imageUrl?: string) {
    const storyboard = {
      id: Date.now().toString(),
      sceneId,
      description,
      imageUrl,
    };
    this.storyboards.push(storyboard);
    return storyboard;
  }

  getStoryboards() {
    return [...this.storyboards];
  }

  addBeatSheet(act: number, beat: string, description: string) {
    const beatSheet = {
      id: Date.now().toString(),
      act,
      beat,
      description,
    };
    this.beatSheets.push(beatSheet);
    return beatSheet;
  }

  getBeatSheets() {
    return [...this.beatSheets];
  }
}
