import ePub from 'epubjs';
import type { BookMetadata } from '../types/epub';

class EpubService {
  private book: any = null;

  async loadEpub(file: File): Promise<BookMetadata> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.book = ePub(arrayBuffer);
      await this.book.ready;
      const metadata: BookMetadata = {
        title: this.book.packaging.metadata.title || 'Unknown Title',
        author: this.book.packaging.metadata.creator || 'Unknown Author',
        description: this.book.packaging.metadata.description,
        cover: await this.getCoverImage()
      };
      return metadata;
    } catch (error) {
      console.error('EPUB loading error:', error);
      throw new Error('Failed to load EPUB file');
    }
  }

  private async getCoverImage(): Promise<string | undefined> {
    try {
      const cover = await this.book.coverUrl();
      return cover;
    } catch {
      return undefined;
    }
  }
}

export default new EpubService();