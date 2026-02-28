package com.hankabakc.analyzepanel.membership.service;

import com.hankabakc.analyzepanel.auth.dto.UserDto;
import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.enums.UserRole;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import com.hankabakc.analyzepanel.auth.repository.AppUserRepository;
import com.hankabakc.analyzepanel.membership.dto.PairingRequest;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * MembershipService: Üyelik süreçlerini, kullanıcı onaylarını ve 
 * hiyerarşik (öğretmen-öğrenci) eşleşmeleri yöneten servis katmanıdır.
 */
@Service
public class MembershipService {

    private final AppUserRepository userRepository;
    private final EntityManager entityManager;

    /**
     * Constructor Injection: Gerekli bağımlılıklar enjekte edilir.
     */
    public MembershipService(AppUserRepository userRepository, EntityManager entityManager) {
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    /**
     * getPendingUsers: Onay bekleyen tüm kullanıcı başvurularını getirir.
     */
    @Transactional(readOnly = true)
    public List<UserDto> getPendingUsers() {
        return userRepository.findAllByStatus(UserStatus.PENDING).stream()
                .map(u -> new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getStatus()))
                .toList();
    }

    /**
     * getActiveTeachers: Sistemdeki onaylanmış (ACTIVE) tüm eğitmenleri getirir.
     * Eşleştirme merkezinde seçim yapmak için kullanılır.
     */
    @Transactional(readOnly = true)
    public List<UserDto> getActiveTeachers() {
        return userRepository.findAllByRoleAndStatus(UserRole.TEACHER, UserStatus.ACTIVE).stream()
                .map(u -> new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getStatus()))
                .toList();
    }

    /**
     * getActiveStudents: Sistemdeki onaylanmış (ACTIVE) tüm öğrencileri getirir.
     * Eşleştirme merkezinde seçim yapmak için kullanılır.
     */
    @Transactional(readOnly = true)
    public List<UserDto> getActiveStudents() {
        return userRepository.findAllByRoleAndStatus(UserRole.STUDENT, UserStatus.ACTIVE).stream()
                .map(u -> new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getStatus()))
                .toList();
    }

    /**
     * updateUserStatus: Bir kullanıcının durumunu günceller (Onayla/Reddet).
     */
    @Transactional
    public void updateUserStatus(UUID userId, UserStatus newStatus) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));
        
        user.setStatus(newStatus);
        userRepository.save(user);
    }

    /**
     * getStudentsOfTeacher: Belirli bir öğretmene atanmış olan tüm öğrencileri listeler.
     * Native Query ile hiyerarşi tablosu (pairings) ve kullanıcı tablosu join edilir.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<UserDto> getStudentsOfTeacher(UUID teacherId) {
        List<AppUser> users = entityManager.createNativeQuery(
                "SELECT u.* FROM app_users u " +
                "JOIN student_teacher_pairings p ON u.id = p.student_id " +
                "WHERE p.teacher_id = :tId", AppUser.class)
                .setParameter("tId", teacherId)
                .getResultList();
        
        return users.stream()
                .map(u -> new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getStatus()))
                .toList();
    }

    /**
     * getTeachersOfStudent: Belirli bir öğrenciye atanmış olan tüm öğretmenleri listeler.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<UserDto> getTeachersOfStudent(UUID studentId) {
        List<AppUser> users = entityManager.createNativeQuery(
                "SELECT u.* FROM app_users u " +
                "JOIN student_teacher_pairings p ON u.id = p.teacher_id " +
                "WHERE p.student_id = :sId", AppUser.class)
                .setParameter("sId", studentId)
                .getResultList();

        return users.stream()
                .map(u -> new UserDto(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getStatus()))
                .toList();
    }

    /**
     * pairStudentWithTeacher: Bir öğrenciyi bir öğretmenle eşleştirir.
     * Native Query kullanılarak 'student_teacher_pairings' tablosuna kayıt atılır.
     */
    /**
     * pairStudentWithTeacher: Bir öğrenciyi bir öğretmenle eşleştirir.
     */
    @Transactional
    public void pairStudentWithTeacher(PairingRequest request) {
        AppUser student = userRepository.findById(request.studentId())
                .orElseThrow(() -> new RuntimeException("Öğrenci bulunamadı."));
        
        AppUser teacher = userRepository.findById(request.teacherId())
                .orElseThrow(() -> new RuntimeException("Öğretmen bulunamadı."));

        entityManager.createNativeQuery(
                "INSERT INTO student_teacher_pairings (student_id, teacher_id) VALUES (:sId, :tId) " +
                "ON CONFLICT DO NOTHING")
                .setParameter("sId", student.getId())
                .setParameter("tId", teacher.getId())
                .executeUpdate();
    }

    /**
     * isTeacherOfStudent: Bir öğretmenin belirli bir öğrenciye erişim yetkisi olup olmadığını kontrol eder.
     * Güvenlik (IDOR) kontrolleri için kullanılır.
     */
    @Transactional(readOnly = true)
    public boolean isTeacherOfStudent(UUID teacherId, UUID studentId) {
        Long count = (Long) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM student_teacher_pairings " +
                "WHERE teacher_id = :tId AND student_id = :sId")
                .setParameter("tId", teacherId)
                .setParameter("sId", studentId)
                .getSingleResult();
        return count > 0;
    }
}
