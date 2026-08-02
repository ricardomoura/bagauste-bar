export type Category = {
  id: string;
  name_pt: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
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
