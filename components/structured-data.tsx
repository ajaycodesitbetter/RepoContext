import Script from "next/script";

export function StructuredData({ data }: { data: any }) {
  return (
    <Script
      id={`structured-data-${Math.random().toString(36).substr(2, 9)}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
