package com.workstudy.repository;

import com.workstudy.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);
    List<Application> findByJobId(Long jobId);
    List<Application> findByStatus(Application.Status status);
    Optional<Application> findByStudentIdAndJobId(Long studentId, Long jobId);
    long countByJobId(Long jobId);
    long countByJobIdAndStatus(Long jobId, Application.Status status);
    void deleteByStudentId(Long studentId);
}
