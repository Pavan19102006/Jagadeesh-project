package com.workstudy.repository;

import com.workstudy.entity.WorkHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorkHoursRepository extends JpaRepository<WorkHours, Long> {
    List<WorkHours> findByStudentId(Long studentId);
    List<WorkHours> findByJobId(Long jobId);
    List<WorkHours> findByStudentIdAndJobId(Long studentId, Long jobId);
    List<WorkHours> findByStatus(WorkHours.Status status);
    List<WorkHours> findByStudentIdAndWorkDateBetween(Long studentId, LocalDate startDate, LocalDate endDate);
    void deleteByStudentId(Long studentId);
}
