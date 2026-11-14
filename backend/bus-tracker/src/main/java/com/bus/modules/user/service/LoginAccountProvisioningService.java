package com.bus.modules.user.service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.bus.common.exception.ResourceNotFoundException;
import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;
import com.bus.modules.school.entity.School;
import com.bus.modules.school.entity.SchoolStatus;
import com.bus.modules.school.repository.SchoolRepository;
import com.bus.modules.students.entity.StudentsEntity;
import com.bus.modules.students.repository.StudentsRepository;
import com.bus.modules.user.dto.GenerateLoginAccountsRequest;
import com.bus.modules.user.dto.GeneratedLoginCredentialResponse;
import com.bus.modules.user.entity.User;
import com.bus.modules.user.entity.UserRole;
import com.bus.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class LoginAccountProvisioningService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final StudentsRepository studentsRepository;
    private final DriversRepository driversRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final CredentialEncryptionService credentialEncryptionService;

    public List<GeneratedLoginCredentialResponse> generateAccounts(GenerateLoginAccountsRequest request) {
        List<Long> studentIds = request.studentIds() == null ? List.of() : request.studentIds().stream().distinct().toList();
        List<Long> driverIds = request.driverIds() == null ? List.of() : request.driverIds().stream().distinct().toList();

        if (studentIds.isEmpty() && driverIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one student or driver.");
        }

        Long schoolId = getSchoolAdminSchoolId();
        List<GeneratedLoginCredentialResponse> credentials = new ArrayList<>();

        for (Long id : studentIds) {
            StudentsEntity student = studentsRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
            if (!schoolId.equals(student.getSchoolId()) || !"ACTIVE".equalsIgnoreCase(student.getStatus())) {
                throw new IllegalArgumentException("Student is inactive or does not belong to your school: " + id);
            }
            if (student.getUserId() != null) {
                throw new IllegalArgumentException("Student already has a login account: " + id);
            }
            if (!StringUtils.hasText(student.getRollNumber())) {
                throw new IllegalArgumentException("Roll number is required to generate a student Login ID: " + id);
            }

            String fullName = fullName(student.getFirstName(), student.getLastName());
            String loginId = uniqueLoginId(student.getFirstName() + student.getRollNumber());
            String password = generateSixDigitPassword();

            User user = new User();
            user.setFullName(fullName);
            user.setLoginId(loginId);
            user.setEmail(null);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setPasswordDisplayEncrypted(credentialEncryptionService.encrypt(password));
            user.setRole(UserRole.STUDENT);
            user.setEnabled(true);
            user = userRepository.saveAndFlush(user);

            student.setUserId(user.getId());
            studentsRepository.save(student);
            credentials.add(new GeneratedLoginCredentialResponse(
                    student.getId(), fullName, student.getRollNumber(), UserRole.STUDENT, loginId, password));
        }

        for (Long id : driverIds) {
            DriversEntity driver = driversRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + id));
            if (!schoolId.equals(driver.getSchoolId()) || !"ACTIVE".equalsIgnoreCase(driver.getStatus())) {
                throw new IllegalArgumentException("Driver is inactive or does not belong to your school: " + id);
            }
            if (driver.getUserId() != null) {
                throw new IllegalArgumentException("Driver already has a login account: " + id);
            }

            String fullName = fullName(driver.getFirstName(), driver.getLastName());
            String loginId = uniqueLoginId(driver.getFirstName() + driver.getDriverCode());
            String password = generateSixDigitPassword();

            User user = new User();
            user.setFullName(fullName);
            user.setLoginId(loginId);
            user.setEmail(null);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole(UserRole.DRIVER);
            user.setEnabled(true);
            user = userRepository.saveAndFlush(user);

            driver.setUserId(user.getId());
            driversRepository.save(driver);
            credentials.add(new GeneratedLoginCredentialResponse(
                    driver.getId(), fullName, driver.getDriverCode(), UserRole.DRIVER, loginId, password));
        }

        return credentials;
    }

    private Long getSchoolAdminSchoolId() {
        List<School> activeSchools = schoolRepository.findAll().stream()
                .filter(school -> school.getStatus() == SchoolStatus.ACTIVE)
                .toList();
        if (activeSchools.size() != 1) {
            throw new IllegalStateException(
                    "Exactly one active school must be configured for the School Admin account.");
        }
        return activeSchools.get(0).getId();
    }

    private String uniqueLoginId(String raw) {
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("Unable to generate Login ID from the supplied name and code.");
        }
        normalized = normalized.substring(0, Math.min(normalized.length(), 70));

        String candidate = normalized;
        int suffix = 1;
        while (userRepository.existsByLoginIdIgnoreCase(candidate)) {
            String ending = Integer.toString(suffix++);
            candidate = normalized.substring(0, Math.min(normalized.length(), 80 - ending.length())) + ending;
        }
        return candidate;
    }

    private String generateSixDigitPassword() {
        return Integer.toString(100000 + RANDOM.nextInt(900000));
    }

    private String fullName(String firstName, String lastName) {
        return (firstName + (StringUtils.hasText(lastName) ? " " + lastName : "")).trim();
    }
}
