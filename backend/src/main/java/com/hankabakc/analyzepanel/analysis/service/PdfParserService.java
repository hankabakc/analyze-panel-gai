package com.hankabakc.analyzepanel.analysis.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * PdfParserService: Yüklenen PDF belgelerindeki metinleri ayrıştıran servistir.
 * Apache PDFBox kütüphanesini kullanarak dijital metin verisini çıkarır.
 */
@Service
public class PdfParserService {

    /**
     * extractText: MultipartFile formatındaki PDF dosyasının içeriğini okur.
     * @param file Yüklenen dosya
     * @return PDF içindeki ham metin
     */
    public String extractText(MultipartFile file) {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            // PDF üzerindeki metinleri ayıklamak için PDFTextStripper nesnesi kullanılır.
            PDFTextStripper stripper = new PDFTextStripper();
            
            // Tüm sayfaları dolaşarak metni çıkarır.
            String text = stripper.getText(document);
            
            if (text == null || text.trim().isEmpty()) {
                throw new RuntimeException("PDF içeriği okunamadı veya dosya boş.");
            }
            
            return text;
        } catch (IOException e) {
            throw new RuntimeException("PDF dosyası işlenirken teknik bir hata oluştu.", e);
        }
    }
}
