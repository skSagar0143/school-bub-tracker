package com.bus.modules.school.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.bus.modules.school.application.SchoolPersistencePort;
import com.bus.modules.school.domain.School;
import com.bus.modules.school.domain.SchoolStatus;
import com.bus.modules.school.infrastructure.persistence.entity.SchoolJpaEntity;
import com.bus.modules.school.infrastructure.persistence.repository.SpringDataSchoolRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SchoolPersistenceAdapter implements SchoolPersistencePort {

    private final SpringDataSchoolRepository repository;

    @Override
    public School save(School school) {
        SchoolJpaEntity entity = school.id() == null
                ? new SchoolJpaEntity()
                : repository.findById(school.id()).orElseThrow();
        entity.setName(school.name());
        entity.setCode(school.code());
        entity.setEmail(school.email());
        entity.setPhone(school.phone());
        entity.setWebsite(school.website());
        entity.setAddressLine1(school.addressLine1());
        entity.setAddressLine2(school.addressLine2());
        entity.setCity(school.city());
        entity.setState(school.state());
        entity.setPincode(school.pincode());
        entity.setCountry(school.country());
        if (school.status() != null) entity.setStatus(school.status());
        return toDomain(repository.save(entity));
    }

    @Override
    public Optional<School> findById(Long id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<School> findAll() {
        return repository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsByCode(String code) {
        return repository.existsByCode(code);
    }

    private School toDomain(SchoolJpaEntity entity) {
        return new School(entity.getId(), entity.getName(), entity.getCode(), entity.getEmail(),
                entity.getPhone(), entity.getWebsite(), entity.getAddressLine1(),
                entity.getAddressLine2(), entity.getCity(), entity.getState(),
                entity.getPincode(), entity.getCountry(), entity.getStatus(),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
