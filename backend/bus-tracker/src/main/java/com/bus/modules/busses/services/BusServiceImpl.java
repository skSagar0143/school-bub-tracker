package com.bus.modules.busses.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.busses.entity.BusEntity;
import com.bus.modules.busses.repository.BusRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class BusServiceImpl implements BusServices {

	private final BusRepository busRepository;

	@Override
	public BusEntity createBus(BusEntity bus) {

		if (busRepository.existsBySchoolIdAndBusNumber(bus.getSchoolId(), bus.getBusNumber())) {
			throw new RuntimeException("Bus number already exists in this school");
		}

		if (busRepository.existsByRegistrationNumber(bus.getRegistrationNumber())) {
			throw new RuntimeException("Registration number already exists");
		}

		bus.setStatus("ACTIVE");

		return busRepository.save(bus);
	}

	@Override
	public BusEntity updateBus(Long id, BusEntity bus) {
		BusEntity existingBus = getBusById(id);

		if (busRepository.existsBySchoolIdAndBusNumberAndIdNot(bus.getSchoolId(), bus.getBusNumber(), id)) {
			throw new RuntimeException("Bus number already exists in this school");
		}

		if (busRepository.existsByRegistrationNumberAndIdNot(bus.getRegistrationNumber(), id)) {
			throw new RuntimeException("Registration number already exists");
		}
		existingBus.setSchoolId(bus.getSchoolId());
		existingBus.setBusNumber(bus.getBusNumber());
		existingBus.setRegistrationNumber(bus.getRegistrationNumber());
		existingBus.setModel(bus.getModel());
		existingBus.setCapacity(bus.getCapacity());
		existingBus.setBusType(bus.getBusType());
		existingBus.setFuelType(bus.getFuelType());
		existingBus.setManufactureYear(bus.getManufactureYear());
		existingBus.setInsuranceNumber(bus.getInsuranceNumber());
		existingBus.setInsuranceExpiryDate(bus.getInsuranceExpiryDate());
		existingBus.setFitnessExpiryDate(bus.getFitnessExpiryDate());

		return busRepository.save(existingBus);
	}

	@Override
	@Transactional(readOnly = true)
	public BusEntity getBusById(Long id) {

		return busRepository.findById(id).filter(bus -> "ACTIVE".equals(bus.getStatus()))
				.orElseThrow(() -> new RuntimeException("Active bus not found with ID: " + id));
	}

	@Override
	@Transactional(readOnly = true)
	public List<BusEntity> getAllBuses() {

		return busRepository.findByStatus("ACTIVE");
	}

	@Override
	@Transactional(readOnly = true)
	public List<BusEntity> getBusesBySchoolId(Long schoolId) {

		return busRepository.findBySchoolIdAndStatus(schoolId, "ACTIVE");
	}

	@Override
	public void deleteBus(Long id) {
		BusEntity bus = getBusById(id);
		bus.setStatus("INACTIVE");

		busRepository.save(bus);

	}

}
