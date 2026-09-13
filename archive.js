        /* ⭐ Schema.org AggregateRating */
        if (r.id && r.ratings_count > 0 && r.ratings_avg > 0) {
            const ld = document.createElement('script');
            ld.type = 'application/ld+json';
            ld.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": (r.text || '').slice(0, 110),
                "datePublished": r.created_at || new Date().toISOString(),
                "author": { "@type": "Person", "name": r.author || "Anonymous" },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": Number(r.ratings_avg).toFixed(1),
                    "ratingCount": r.ratings_count,
                    "bestRating": 5,
                    "worstRating": 1
                }
            });
            el.appendChild(ld);
        }
