export type Bar = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  primary_color: string;
  header_mode: "light" | "brand";
  logo_url: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

export type Category = {
  id: string;
  bar_id: string;
  name_pt: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  bar_id: string;
  category_id: string | null;
  name_pt: string;
  name_en: string;
  description_pt: string;
  description_en: string;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Lang = "pt" | "en";
