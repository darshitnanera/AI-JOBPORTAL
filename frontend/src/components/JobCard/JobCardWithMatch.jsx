/**
 * JobCardWithMatch — legacy entry point.
 *
 * JobCard now merges company + role into a single opportunity card and renders
 * the AI match badge itself (only when the API supplied a score). This adapter
 * keeps the older prop shape (a raw backend job document) working.
 */
import React from "react";
import JobCard from "./JobCard";
import { normalizeJob } from "./jobFormat";

const JobCardWithMatch = ({ job, matchScore = null, isApplied = false, ...rest }) => (
  <JobCard job={normalizeJob(job)} matchScore={matchScore} isApplied={isApplied} {...rest} />
);

export default JobCardWithMatch;
