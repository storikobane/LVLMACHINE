import React, { useState, useEffect } from "react";
import "../styles/statsweekly.css";
import { supabase } from "../supabaseClient";

const StatsWeekly = () => {
  const [weeks, setWeeks] = useState([]); // Available weeks
  const [currentWeek, setCurrentWeek] = useState(null); // Current selected week
  const [stats, setStats] = useState([]); // Stats for the selected week
  const [sortField, setSortField] = useState("score"); // Default sort field
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort order

  // Fetch available weeks on component load
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const { data, error } = await supabase
          .from("weekly_stats")
          .select("week_start_day, week_end_day")
          .order("week_start_day", { ascending: false });

        if (error) throw error;

        // Remove duplicate weeks
        const uniqueWeeks = data.filter((week, index, self) =>
          index === self.findIndex((w) => w.week_start_day === week.week_start_day)
        );

        const formattedWeeks = uniqueWeeks.map((week) => ({
          label: `${week.week_start_day} to ${week.week_end_day}`,
          week_start: week.week_start_day,
          week_end: week.week_end_day,
        }));

        setWeeks(formattedWeeks);

        // Set the latest week by default
        if (formattedWeeks.length > 0) {
          setCurrentWeek(formattedWeeks[0]);
        }
      } catch (error) {
        console.error("Error fetching weeks:", error.message);
      }
    };

    fetchWeeks();
  }, []);

  // Fetch stats for the current week
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentWeek) return;

      try {
        const { data, error } = await supabase
          .from("weekly_stats")
          .select("name, score, ppd, advtg") // Fetch relevant stats
          .eq("week_start_day", currentWeek.week_start); // Match the selected week

        if (error) throw error;

        // Sort the stats by the selected field
        const sortedStats = data.sort((a, b) =>
          sortOrder === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
        );

        setStats(sortedStats);
      } catch (error) {
        console.error("Error fetching stats:", error.message);
      }
    };

    fetchStats();
  }, [currentWeek, sortField, sortOrder]);

  // Handle week navigation (next/previous week)
  const navigateWeek = (direction) => {
    const currentIndex = weeks.findIndex((week) => week.week_start === currentWeek.week_start);

    if (direction === "prev" && currentIndex < weeks.length - 1) {
      setCurrentWeek(weeks[currentIndex + 1]);
    }

    if (direction === "next" && currentIndex > 0) {
      setCurrentWeek(weeks[currentIndex - 1]);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    setSortField(field);
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="stats-weekly">
      <h1>Weekly Stats</h1>

      {/* Week Selector */}
      <div className="week-selector">
        <button onClick={() => navigateWeek("prev")} disabled={!weeks.length || currentWeek === weeks[weeks.length - 1]}>
          Previous Week
        </button>
        <select
          value={currentWeek?.label || ""}
          onChange={(e) =>
            setCurrentWeek(weeks.find((week) => week.label === e.target.value))
          }
        >
          {weeks.map((week) => (
            <option key={week.week_start} value={week.label}>
              {week.label}
            </option>
          ))}
        </select>
        <button onClick={() => navigateWeek("next")} disabled={!weeks.length || currentWeek === weeks[0]}>
          Next Week
        </button>
      </div>

      {/* Stats Table */}
      <div className="table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>Player Name</th>
              <th onClick={() => handleSort("score")}>Points</th>
              <th onClick={() => handleSort("ppd")}>PPD</th>
              <th onClick={() => handleSort("advtg")}>Advantage</th>
            </tr>
          </thead>
          <tbody>
            {stats.length > 0 ? (
              stats.map((player, index) => (
                <tr key={index}>
                  <td>{player.name}</td>
                  <td>{player.score}</td>
                  <td>{player.ppd}</td>
                  <td>{player.advtg}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No stats available for this week.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsWeekly;
