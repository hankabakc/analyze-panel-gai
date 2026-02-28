package com.hankabakc.analyzepanel.analysis.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * GeminiAiService: Google Gemini API ile iletişimi yöneten servis katmanıdır.
 * PDF dosyasını (Görsel olarak) analiz eder ve yapısal (JSON) veri haline getirir.
 */
@Service
public class GeminiAiService {

    @Value("${application.ai.gemini.api-key:YOUR_API_KEY_HERE}")
    private String apiKey;

    @Value("${application.ai.gemini.model:gemini-1.5-flash}")
    private String modelName;

    private final RestClient restClient;

    public GeminiAiService(RestClient.Builder restClientBuilder) {
        // AI Timeout Hardening: Karmaşık PDF analizleri için 240 saniye (4 dakika) zaman aşımı tanımlandı.
        org.springframework.http.client.JdkClientHttpRequestFactory factory = new org.springframework.http.client.JdkClientHttpRequestFactory();
        factory.setReadTimeout(java.time.Duration.ofSeconds(240));
        
        this.restClient = restClientBuilder
                .requestFactory(factory)
                .build();
    }

    /**
     * analyzeReportPdf: PDF dosyasını (Görsel olarak) Gemini'ye gönderir.
     */
    public String analyzeReportPdf(MultipartFile file, Integer examCount, String reportType, String history) {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";
        
        try {
            String base64Data = Base64.getEncoder().encodeToString(file.getBytes());
            
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", buildSuperAnalystPrompt(examCount, reportType, history)),
                        Map.of("inline_data", Map.of(
                            "mime_type", "application/pdf",
                            "data", base64Data
                        ))
                    ))
                )
            );

            int maxRetries = 3;
            int retryDelay = 2000;

            for (int i = 0; i < maxRetries; i++) {
                try {
                    System.out.println(">> [GEMINI] Süper Analist Modunda İstek Gönderiliyor (Deneme " + (i + 1) + ")...");
                    
                    Map<String, Object> response = restClient.post()
                            .uri(apiUrl + "?key=" + apiKey)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(requestBody)
                            .retrieve()
                            .body(Map.class);

                    String aiResponse = extractTextFromResponse(response);
                    
                    System.out.println("\n--- AI STUDIO'DAN GELEN HAM CEVAP ---");
                    System.out.println(aiResponse);
                    System.out.println("--- AI STUDIO'DAN GELEN HAM CEVAP BİTTİ ---\n");
                    
                    return sanitizeJsonResponse(aiResponse);
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("429") && i < maxRetries - 1) {
                        System.err.println(">> Gemini API Meşgul (429). Bekleniyor...");
                        try { Thread.sleep(retryDelay * (i + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                        continue;
                    }
                    throw new RuntimeException("Gemini AI hatası: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("PDF dosyası işlenirken hata oluştu: " + e.getMessage());
        }
        return "{}";
    }

    /**
     * sanitizeJsonResponse: AI cevabındaki markdown işaretlerini temizler.
     */
    private String sanitizeJsonResponse(String raw) {
        if (raw == null) return "{}";
        String clean = raw.trim();
        if (clean.startsWith("```json")) clean = clean.substring(7);
        else if (clean.startsWith("```")) clean = clean.substring(3);
        if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
        return clean.trim();
    }

    /**
     * cleanPrompt: Kullanıcıdan gelen metinlerdeki tehlikeli AI manipülasyon komutlarını temizler.
     */
    private String cleanPrompt(String text) {
        if (text == null) return "";
        return text.replaceAll("(?i)(ignore all|previous|instructions|system prompt|reset|delete|forget)", "[CLEANED]");
    }

    private String buildSuperAnalystPrompt(Integer examCount, String reportType, String history) {
        String cleanHistory = cleanPrompt(history);
        return """
            GÖREV: Sen kıdemli bir Eğitim Koçu ve Veri Analistisin. 
// ... (Promptun devamı aynı kalacak)
            """.formatted(cleanHistory);
    }

    public String generateText(String prompt) {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        try {
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);
            return extractTextFromResponse(response);
        } catch (Exception e) {
            return "AI özeti şu an oluşturulamadı: " + e.getMessage();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        try {
            var candidates = (List<Map<String, Object>>) response.get("candidates");
            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "{}";
        }
    }
}
