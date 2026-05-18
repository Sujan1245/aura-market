export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    tags: string[];
    inventory: number;
}

export const aiService = {
    async getRecommendations(userActivity: any[], products: Product[]) {
        const res = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity: userActivity, products })
        });
        if (!res.ok) throw new Error('Recommendation failed');
        const data = await res.json();
        return data.recommendationIds as string[];
    },

    async analyzeImage(imageBase64: string, products: Product[]) {
        const res = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64 })
        });
        if (!res.ok) throw new Error('Image analysis failed');
        const { query } = await res.json();
        
        // Now search with identifying query
        return await this.searchProducts(query, products);
    },

    async searchProducts(query: string, products: Product[]) {
        const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, products })
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        return data as { localIds: string[], discovered: Product[] };
    },

    async getTrending() {
        const res = await fetch('/api/trending');
        if (!res.ok) throw new Error('Trending failed');
        const data = await res.json();
        return data.products as Product[];
    },

    async chat(messages: { role: 'user' | 'assistant', text: string }[], context: Product[]) {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, context })
        });
        if (!res.ok) throw new Error('Chat failed');
        return await res.json();
    }
};
