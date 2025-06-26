export interface BookPage {
  content: string;
  pageNumber: number;
  totalPages: number;
  chapterTitle?: string;
  isCover?: boolean;
}

export interface BookMetadata {
  title: string;
  author: string;
  description?: string;
  cover?: string;
}

export interface AIGeneration {
  summary: string;
  imageUrl: string;
  prompt: string;
  isLoading: boolean;
}

export interface NFTMetadata {
  name: string;
  ticker: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}