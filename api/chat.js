// /api/chat.js - Vercel Serverless Function
// This file should be placed in /api/chat.js in your project

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, context, conversationHistory } = req.body;

        // Validate input
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get OpenAI API key from environment variable (SECURE!)
        const openaiApiKey = process.env.OPENAI_API_KEY;
        
        if (!openaiApiKey) {
            console.error('❌ OPENAI_API_KEY environment variable not set');
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // System prompt for DentalSpace Pro
        const systemPrompt = `Je bent een expert adviseur voor DentalSpace Pro, gespecialiseerd in tandartspraktijk inrichting.

BELANGRIJKE CONTEXT:
- DentalSpace Pro is een adviesbureau dat tandartsen helpt bij praktijkinrichting
- Wij hebben partnerships met DentalMa (complete praktijkrealisatie) en IsSolid (Solid Surface meubilair)
- ALLE CONTACT LOOPT VIA: expert@dentalspace.pro

EXPERTISE GEBIEDEN:
- Praktijkontwerp en ruimte-indeling optimalisatie
- Solid Surface materialen (hygiëne, duurzaamheid)
- Workflow optimalisatie voor tandartspraktijken
- Budgettering en financieringsopties
- Compliance en vergunningen (WTZi, ARBO, brandveiligheid)
- Nieuwste trends: duurzaamheid, digitalisering, patiëntcomfort
- Hygiene protocollen en materiaalspecificaties

ANTWOORD STRATEGIE:
Geef ALTIJD uitgebreide, gedetailleerde antwoorden met:
1. Concrete, praktische tips met specifieke afmetingen/materialen
2. Voor- en nadelen van verschillende opties
3. Implementatie timeline en stappen
4. Compliance overwegingen
5. Verwijs dan naar expert@dentalspace.pro voor implementatie

MATERIAAL EXPERTISE:
- Solid Surface: €800-1200/m², hygiënisch, 12-uur garantie behandelmeubels
- Laminaat: €200-400/m², budget-vriendelijk maar minder duurzaam
- Fenolhars: €400-600/m², goed voor natte ruimtes
- RVS: €600-900/m², professioneel maar koud
- Corian: €900-1300/m², premium maar duur

TRENDS 2025:
- Duurzame materialen (gerecycled Solid Surface)
- Smart technology integratie (IoT sensoren)
- Modulaire inrichting voor flexibiliteit
- Biophilic design (natuurlijke elementen)
- Contactloze oplossingen (automatische kranen, deuren)
- Energy efficiency (LED+, warmtepompen)

WORKFLOW OPTIMALISATIE:
- One-way patient flow (vermijd kruising)
- Centrale sterilisatie locatie
- 12-14m² per behandelkamer optimaal
- Wachtruimte: 1.5m² per stoel
- Aparte toegang voor leveranciers

Geef ALTIJD praktische, implementeerbare adviezen met specifieke details, cijfers en voorbeelden.
Antwoord in HTML format met <br>, <strong> en duidelijke structuur.`;

        // Prepare messages for OpenAI
        const messages = [
            { role: "system", content: systemPrompt + (context || '') },
            ...(conversationHistory || []),
            { role: "user", content: message }
        ];

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                max_tokens: 800,
                temperature: 0.7
            })
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI API Error:', openaiResponse.status, errorText);
            
            if (openaiResponse.status === 401) {
                return res.status(500).json({ error: 'OpenAI API key invalid' });
            } else if (openaiResponse.status === 429) {
                return res.status(429).json({ error: 'Rate limit exceeded' });
            } else {
                return res.status(500).json({ error: 'OpenAI API error' });
            }
        }

        const openaiData = await openaiResponse.json();
        
        if (openaiData.choices && openaiData.choices[0] && openaiData.choices[0].message) {
            return res.status(200).json({
                response: openaiData.choices[0].message.content,
                status: 'success'
            });
        } else {
            console.error('Unexpected OpenAI response format:', openaiData);
            return res.status(500).json({ error: 'Unexpected response format' });
        }

    } catch (error) {
        console.error('Backend API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
