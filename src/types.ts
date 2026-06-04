/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShowcaseImage {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  description?: string;
  category?: string;
  colorTheme?: string;
}

export interface DisplayState {
  currentImageIndex: number;
  images: ShowcaseImage[];
  connectedClients: number;
  lastUpdated: number;
}
