import { useState, useEffect } from 'react';
import aiService from '../services/aiService';

/**
 * Custom React Hook to manage state and actions for the Study Planner page.
 */
export const useSchedule = () => {
  const [goals, setGoals] = useState('');
  const [studyHours, setStudyHours] = useState(2.0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await aiService.getSchedule();
        setTasks(response.data.tasks || []);
      } catch (err) {
        console.error("Error loading study planner schedule:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchSchedule();
  }, []);

  const generatePlanner = async (goalsText, hours) => {
    setLoading(true);
    try {
      const response = await aiService.generateSchedule(goalsText, Number(hours));
      const newTasks = response.data.tasks || [];
      setTasks(newTasks);
      return newTasks;
    } catch (err) {
      console.error("Error generating planner schedule:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
      }
      return t;
    });
    setTasks(updatedTasks);
    try {
      await aiService.updateSchedule(updatedTasks);
    } catch (err) {
      console.error("Failed to sync task status update to DB:", err);
    }
  };

  const deleteTask = async (taskId) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    try {
      await aiService.updateSchedule(updatedTasks);
    } catch (err) {
      console.error("Failed to sync task delete to DB:", err);
    }
  };

  return {
    goals,
    setGoals,
    studyHours,
    setStudyHours,
    tasks,
    loading,
    fetching,
    generatePlanner,
    toggleTaskStatus,
    deleteTask,
  };
};

export default useSchedule;
