import Link from "next/link";
import { OneTapBuyButtonCompact } from "@/components/ui/OneTapBuyButton";

interface RelatedProduct {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  category: string;
  buyUrl: string;
  platform: "tiktok" | "shopee" | "taobao" | "generic";
}

interface RelatedProductsProps {
  storeId: string;
  currentProductId: string;
}

// Simulated data fetch - in production this would query by store/category
async function getRelatedProducts(storeId: string, excludeId: string): Promise<RelatedProduct[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const allProducts: RelatedProduct[] = [
    {
      id: "prod-1",
      name: "Linen Blend Oversized Blazer",
      price: "$89.00",
      imageUrl: "/demo/blazer.jpg",
      category: "Outerwear",
      buyUrl: "https://shop.tiktok.com/demo",
      platform: "tiktok",
    },
    {
      id: "prod-2",
      name: "Silk Midi Skirt",
      price: "$124.00",
      imageUrl: "/demo/skirt.jpg",
      category: "Bottoms",
      buyUrl: "https://shopee.com/demo",
      platform: "shopee",
    },
    {
      id: "prod-3",
      name: "Woven Leather Sandals",
      price: "$156.00",
      imageUrl: "/demo/sandals.jpg",
      category: "Footwear",
      buyUrl: "https://shop.tiktok.com/demo",
      platform: "tiktok",
    },
    {
      id: "prod-4",
      name: "Gold Chain Necklace",
      price: "$42.00",
      imageUrl: "/demo/necklace.jpg",
      category: "Accessories",
      buyUrl: "https://shopee.com/demo",
      platform: "shopee",
    },
  ];

  return allProducts.filter((p) => p.id !== excludeId).slice(0, 4);
}

export async function RelatedProducts({ storeId, currentProductId }: RelatedProductsProps) {
  const products = await getRelatedProducts(storeId, currentProductId);

  if (products.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-serif text-xl text-ivory-100 mb-4">
        More from this video
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${storeId}/${product.id}`}
            className="glass-card overflow-hidden group"
          >
            {/* Product Image */}
            <div className="aspect-[4/5] bg-velolume-600 relative overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-ivory-400 font-mono text-xs">No Image</span>
                </div>
              )}

              {/* Category badge */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 bg-velolume-600/80 backdrop-blur-sm text-ivory-100 text-micro font-mono uppercase">
                  {product.category}
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-velolume-600 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h3 className="font-serif text-sm text-ivory-100 line-clamp-1 group-hover:text-mocha-300 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-mocha-400 text-sm">
                  {product.price}
                </span>
                <OneTapBuyButtonCompact
                  href={product.buyUrl}
                  platform={product.platform}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
