package com.hankabakc.analyzepanel.membership.controller;

import com.hankabakc.analyzepanel.membership.dto.PairingRequest;
import com.hankabakc.analyzepanel.auth.dto.UserDto;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import com.hankabakc.analyzepanel.core.audit.annotation.AuditAction;
import com.hankabakc.analyzepanel.core.model.ApiResponse;
import com.hankabakc.analyzepanel.membership.service.MembershipService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * MembershipController: Kullanıcı yönetimi, onay süreçleri ve 
 * öğretmen-öğrenci eşleşmelerini yöneten API katmanıdır.
 */
@RestController
@RequestMapping("/api/v1/membership")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    /**
     * getPendingUsers: Onay bekleyen tüm kullanıcıları listeler.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<List<UserDto>> getPendingUsers() {
        List<UserDto> pendingUsers = membershipService.getPendingUsers();
        return ApiResponse.success(pendingUsers, "Onay bekleyen kullanıcılar başarıyla getirildi.");
    }

    /**
     * getTeachers: Sistemdeki tüm aktif öğretmenleri getirir.
     */
    @GetMapping("/teachers")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<List<UserDto>> getTeachers() {
        List<UserDto> teachers = membershipService.getActiveTeachers();
        if (teachers.size() > 100) teachers = teachers.subList(0, 100);
        return ApiResponse.success(teachers, "Aktif öğretmenler listesi getirildi.");
    }

    /**
     * getStudents: Sistemdeki tüm aktif öğrencileri getirir.
     */
    @GetMapping("/students")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<List<UserDto>> getStudents() {
        List<UserDto> students = membershipService.getActiveStudents();
        if (students.size() > 100) students = students.subList(0, 100);
        return ApiResponse.success(students, "Aktif öğrenciler listesi getirildi.");
    }

    /**
     * getMyStudents: Giriş yapan öğretmenin kendi öğrencilerini listelemesini sağlar.
     */
    @GetMapping("/my-students")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<List<UserDto>> getMyStudents(@RequestAttribute("userId") String userId) {
        List<UserDto> students = membershipService.getStudentsOfTeacher(UUID.fromString(userId));
        return ApiResponse.success(students, "Öğrenci listeniz getirildi.");
    }

    /**
     * getMyTeachers: Giriş yapan öğrencinin kendi öğretmenlerini listelemesini sağlar.
     */
    @GetMapping("/my-teachers")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<List<UserDto>> getMyTeachers(@RequestAttribute("userId") String userId) {
        List<UserDto> teachers = membershipService.getTeachersOfStudent(UUID.fromString(userId));
        return ApiResponse.success(teachers, "Eğitmen listeniz getirildi.");
    }

    /**
     * approveUser: Belirtilen kullanıcıyı onaylar.
     */
    @PostMapping("/approve/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @AuditAction("USER_APPROVE")
    public ApiResponse<Void> approveUser(@PathVariable UUID id) {
        membershipService.updateUserStatus(id, UserStatus.ACTIVE);
        return ApiResponse.success(null, "Kullanıcı başarıyla onaylandı.");
    }

    /**
     * rejectUser: Belirtilen kullanıcının başvurusunu reddeder.
     */
    @PostMapping("/reject/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @AuditAction("USER_REJECT")
    public ApiResponse<Void> rejectUser(@PathVariable UUID id) {
        membershipService.updateUserStatus(id, UserStatus.REJECTED);
        return ApiResponse.success(null, "Kullanıcı başvurusu reddedildi.");
    }

    /**
     * pair: Bir öğrenci ve öğretmeni birbirine bağlar.
     */
    @PostMapping("/pair")
    @PreAuthorize("hasRole('MANAGER')")
    @AuditAction("STUDENT_TEACHER_PAIR")
    public ApiResponse<Void> pairStudentTeacher(@RequestBody PairingRequest request) {
        membershipService.pairStudentWithTeacher(request);
        return ApiResponse.success(null, "Eşleştirme işlemi başarıyla tamamlandı.");
    }
}
