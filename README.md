# 📊 ANALYZEPANEL
### AI-Driven Educational Analytics & Performance Tracking System

[![Java](https://img.shields.io/badge/Java-25-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.2-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)

---

## 🌐 Language / Dil
- [English](#-english)
- [Türkçe](#-türkçe)

---

## 🇺🇸 English

### 📝 Overview
**ANALYZEPANEL** is a next-generation educational management platform designed to bridge the gap between raw student data and actionable academic insights. By leveraging **Multimodal AI (Gemini 2.5 Flash)**, the system automates the analysis of PDF report cards and exam results.

Built on a **Modular Monolith** architecture with **Java 25 (Virtual Threads)**, it ensures high concurrency and enterprise-grade scalability.

### ✨ Core Features
*   🤖 **AI-Powered OCR Analysis:** Automatic extraction of exam data from PDF uploads using advanced AI vision.
*   📈 **Cumulative Growth Tracking:** Dynamic visualization of student progress with interactive Recharts.
*   🏛️ **SaaS-Ready Hierarchy:** Specialized dashboards for Managers, Teachers, and Students.
*   🎯 **Strategic Insight Engine:** AI-generated "Global Summaries" for personalized study recommendations.

### 🛠️ Tech Stack
- **Backend:** Java 25, Spring Boot 4.0.2, PostgreSQL 17, Flyway, JJWT, Gemini 2.5 Flash API.
- **Frontend:** React 19.2, Vite 6, Tailwind CSS 4.0, Recharts, Lucide React.

### 🔧 Quick Start
1. **Database:** `docker-compose up -d`
2. **Backend:** 
   ```powershell
   $env:APPLICATION_AI_GEMINI_API_KEY="your_api_key"
   cd backend && ./mvnw clean spring-boot:run
   ```
3. **Frontend:**
   ```bash
   cd frontend && npm install && npm run dev
   ```

---

## 🇹🇷 Türkçe

### 📝 Genel Bakış
**ANALYZEPANEL**, ham öğrenci verilerini anlamlı akademik içgörülere dönüştürmek için tasarlanmış yeni nesil bir eğitim yönetim platformudur. **Çok Modlu Yapay Zeka (Gemini 2.5 Flash)** teknolojisini kullanan sistem, PDF karnelerin ve sınav sonuçlarının analizini otomatikleştirir.

**Java 25 (Virtual Threads)** ve **Modüler Monolit** mimarisi üzerine inşa edilen sistem, yüksek performans ve kurumsal ölçeklenebilirlik sağlar.

### ✨ Temel Özellikler
*   🤖 **AI Destekli OCR Analizi:** Yapay zeka vizyonu ile PDF'lerden otomatik sınav verisi ayıklama.
*   📈 **Kümülatif Gelişim Takibi:** Etkileşimli Recharts grafikleri ile dinamik gelişim izleme.
*   🏛️ **Hiyerarşik Yönetim:** Yönetici, Öğretmen ve Öğrenci rolleri için özelleştirilmiş paneller.
*   🎯 **Stratejik Analiz Motoru:** Kişiselleştirilmiş çalışma önerileri sunan AI "Küresel Özetleri".

### 🛠️ Teknoloji Yığını
- **Backend:** Java 25, Spring Boot 4.0.2, PostgreSQL 17, Flyway, JJWT, Gemini 2.5 Flash API.
- **Frontend:** React 19.2, Vite 6, Tailwind CSS 4.0, Recharts, Lucide React.

### 🔧 Hızlı Kurulum
1. **Veritabanı:** `docker-compose up -d`
2. **Sunucu (Backend):** 
   ```powershell
   $env:APPLICATION_AI_GEMINI_API_KEY="api_anahtariniz"
   cd backend && ./mvnw clean spring-boot:run
   ```
3. **Arayüz (Frontend):**
   ```bash
   cd frontend && npm install && npm run dev
   ```

---
© 2026 ANALYZEPANEL Platform. Developed with precision and modern engineering standards.
