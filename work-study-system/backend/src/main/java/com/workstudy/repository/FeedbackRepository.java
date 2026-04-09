package com.workstudy.repository;

import com.workstudy.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByStudentId(Long studentId);
    List<Feedback> findByJobId(Long jobId);
    List<Feedback> findByGivenById(Long givenById);
    void deleteByStudentId(Long studentId);
}
