import { useState, useEffect } from 'react';
import aiService from '../services/aiService';

/**
 * Custom React Hook to load study analytics, quizzes, schedule planner tasks, 
 * and perform automated AI weakness evaluation on quiz telemetry.
 */
export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weakTopicsData, setWeakTopicsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const [analyticsRes, quizzesRes, scheduleRes] = await Promise.all([
          aiService.getAnalytics(),
          aiService.getQuizzes(),
          aiService.getSchedule()
        ]);
        
        setAnalytics(analyticsRes.data);
        setQuizzes(quizzesRes.data);
        setTasks(scheduleRes.data.tasks || []);

        const failedAttempts = [];
        quizzesRes.data.forEach(quiz => {
          if (quiz.questions) {
            quiz.questions.forEach(q => {
              failedAttempts.push({
                question: q.question,
                subject: quiz.material_id || "General Study",
                correct: false
              });
            });
          }
        });

        if (failedAttempts.length > 0) {
          try {
            const weakRes = await aiService.analyzeWeakTopics(failedAttempts.slice(0, 5));
            setWeakTopicsData(weakRes.data);
          } catch (weakErr) {
            console.error("AI Weak Analysis check failed:", weakErr);
          }
        }
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  return {
    analytics,
    quizzes,
    tasks,
    weakTopicsData,
    loading
  };
};

export default useAnalytics;
