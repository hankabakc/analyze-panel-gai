/**
 * types.ts: Uygulama genelinde kullanılan ana tip ve arayüz (interface) tanımlamaları.
 * Backend (Java) tarafındaki Entity ve DTO yapıları ile %100 uyumludur.
 */

/**
 * UserRole: Sistemdeki kullanıcı yetki seviyeleri.
 */
export type UserRole = "STUDENT" | "TEACHER" | "MANAGER";

/**
 * UserStatus: Kullanıcının sistemdeki aktiflik durumu.
 * PENDING: Kayıt olmuş ancak Admin (Manager) onayı bekliyor.
 */
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED";

/**
 * ApiResponse: Backend'den dönen standart zarf yapısı.
 * success: İşlemin başarı durumu.
 * message: Kullanıcıya gösterilecek Türkçe mesaj.
 * data: Backend'den dönen asıl veri (Generic).
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * User: Sistemdeki kullanıcı profil bilgilerini temsil eder.
 */
export interface User {
  id: string; // UUID formatında
  email: string;
  phoneNumber: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * AnalysisResponse: Başarılı Login veya Register sonrası dönen veri yapısı.
 * NOT: Bu isim çakışmasını önlemek için AuthResponse'dan ayırdık. Backend'deki DTO ile aynıdır.
 */
export interface AuthResponse {
  token: string;
  user: User;
}

// Backend'deki AnalysisResponse DTO'su ile eşleşen tipler
export interface AnalysisData {
  id: string;
  fileName: string;
  examTitle: string;
  processedAt: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  intendedExamCount: number;
  reportType: 'SINGLE' | 'SUMMARY';
  mentorFeedback?: string;
  teacherActionPlan?: string;
  futureProjection?: string;
  strategicPriority?: string;
  targetSchoolName?: string;
  targetSchoolScore?: number;
  validationErrors?: string;
  examList: ExamSummary[];
  consolidatedResult: ConsolidatedResult;
  globalFeedback: string;
  topicTrendData?: TopicTrendData;
}

export interface TopicTrendData {
  heatmap: TopicHistory[];
  chronicTopics: string[];
  improvedTopics: string[];
  inconsistentTopics: string[];
}

export interface TopicHistory {
  lessonName: string;
  topicName: string;
  statusHistory: ('CORRECT' | 'WRONG' | 'EMPTY')[];
}

export interface ExamSummary {
  examName: string;
  examDate: string;
  totalScore: number;
}

export interface ConsolidatedResult {
  lessons: LessonAnalysis[];
}

export interface LessonAnalysis {
  id: string;
  lessonName: string;
  correct: number;
  wrong: number;
  empty: number;
  successRate: number;
  topics: TopicDetail[];
}

export interface TopicDetail {
  id: string;
  topicName: string;
  status: 'CORRECT' | 'WRONG' | 'EMPTY';
  aiSuggestion: string;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
}
