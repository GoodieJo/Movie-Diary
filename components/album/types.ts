export interface AlbumPhoto {
  id:          string;
  image_url:   string;
  r2_key:      string;
  caption?:    string | null;
  taken_date?: string | null;
  favorite:    number; // 0 | 1
  created_at:  string;
}
