/** Taille commune des illustrations (largeur ; hauteur au ratio 4:3 du viewBox 160 × 120). */
export interface IllustrationProps {
  width?: number;
}

export const VIEWBOX = '0 0 160 120';
export const heightFor = (width: number) => (width * 3) / 4;
