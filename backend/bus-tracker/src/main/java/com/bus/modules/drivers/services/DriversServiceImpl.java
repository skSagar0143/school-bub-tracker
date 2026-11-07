package com.bus.modules.drivers.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DriversServiceImpl implements DriversService {

	private final DriversRepository driversRepository;

	@Override
	public DriversEntity createDriver(DriversEntity driver) {

		if (driversRepository.existsBySchoolIdAndDriverCode(driver.getSchoolId(), driver.getDriverCode())) {
			throw new RuntimeException("Driver code already exists in this school");
		}

		if (driversRepository.existsByLicenseNumber(driver.getLicenseNumber())) {
			throw new RuntimeException("Driving licence number already exists");
		}

		driver.setStatus("ACTIVE");

		return driversRepository.save(driver);
	}

	@Override
	public DriversEntity updateDriver(Long id, DriversEntity driver) {

		DriversEntity existingDriver = getDriverById(id);

		if (driversRepository.existsBySchoolIdAndDriverCodeAndIdNot(driver.getSchoolId(), driver.getDriverCode(), id)) {
			throw new RuntimeException("Driver code already exists in this school");
		}

		if (driversRepository.existsByLicenseNumberAndIdNot(driver.getLicenseNumber(), id)) {
			throw new RuntimeException("Driving licence number already exists");
		}

		existingDriver.setSchoolId(driver.getSchoolId());
		existingDriver.setDriverCode(driver.getDriverCode());
		existingDriver.setFirstName(driver.getFirstName());
		existingDriver.setLastName(driver.getLastName());
		existingDriver.setDateOfBirth(driver.getDateOfBirth());
		existingDriver.setGender(driver.getGender());
		existingDriver.setPhone(driver.getPhone());
		existingDriver.setAlternatePhone(driver.getAlternatePhone());
		existingDriver.setEmail(driver.getEmail());
		existingDriver.setAddress(driver.getAddress());
		existingDriver.setCity(driver.getCity());
		existingDriver.setState(driver.getState());
		existingDriver.setPincode(driver.getPincode());
		existingDriver.setLicenseNumber(driver.getLicenseNumber());
		existingDriver.setLicenseType(driver.getLicenseType());
		existingDriver.setLicenseExpiryDate(driver.getLicenseExpiryDate());
		existingDriver.setJoiningDate(driver.getJoiningDate());
		existingDriver.setEmergencyContactName(driver.getEmergencyContactName());
		existingDriver.setEmergencyContactPhone(driver.getEmergencyContactPhone());

		return driversRepository.save(existingDriver);
	}

	@Override
	@Transactional(readOnly = true)
	public DriversEntity getDriverById(Long id) {

		return driversRepository.findById(id).filter(driver -> "ACTIVE".equals(driver.getStatus()))
				.orElseThrow(() -> new RuntimeException("Driver not found with id: " + id));
	}

	@Override
	@Transactional(readOnly = true)
	public List<DriversEntity> getAllDrivers() {

		return driversRepository.findByStatus("ACTIVE");
	}

	@Override
	@Transactional(readOnly = true)
	public List<DriversEntity> getDriversBySchoolId(Long schoolId) {

		return driversRepository.findBySchoolIdAndStatus(schoolId, "ACTIVE");
	}

	@Override
	public void deleteDriver(Long id) {

		DriversEntity driver = getDriverById(id);

		driver.setStatus("INACTIVE");

		driversRepository.save(driver);
	}
}