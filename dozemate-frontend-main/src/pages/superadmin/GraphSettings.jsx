import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
  Typography,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import "./GraphSettings.css";
import { apiUrl } from "../../config/api";

// ⬇️ These are your defaults (keep using your existing file)
// Expecting shape: { metricKey: { label, defaultType: "NA"|"Value"|"Line", avgSec?: number } }
import metricsConfig from "../../config/metricsConfig";

// Allowed display types
const TYPES = ["NA", "Value", "Line"];

const typeChip = (type) => {
  const map = {
    NA: { color: "default", label: "N/A" },
    Value: { color: "primary", label: "Value" },
    Line: { color: "success", label: "Line" },
  };
  const t = map[type] || map.NA;
  return <Chip size="small" color={t.color} label={t.label} variant="outlined" />;
};

export default function GraphSettings() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [filter, setFilter] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(apiUrl("/api/graph-settings"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const map = {};
        data.forEach((s) => {
          map[s.metric] = {
            selectedType: s.selectedType,
            alertMin: s.alertMin,
            alertMax: s.alertMax,
          };
        });

        const r = Object.keys(metricsConfig)
          .map((key) => ({
            key,
            label: metricsConfig[key].label || key,
            defaultType: metricsConfig[key].graph || "NA",
            avgSec: metricsConfig[key].avgSec ?? null,
            alertMin: metricsConfig[key].alertMin ?? null,
            alertMax: metricsConfig[key].alertMax ?? null,
          }))
          .filter((r) => r.defaultType !== "NA");

        setRows(r);

        const init = {};
        for (const rr of r) {
          init[rr.key] = {
            selectedType: map[rr.key]?.selectedType ?? rr.defaultType,
            alertMin: map[rr.key]?.alertMin ?? rr.alertMin,
            alertMax: map[rr.key]?.alertMax ?? rr.alertMax,
          };
        }
        setDraft(init);
      })
      .catch((err) => console.error("Failed to load graph settings:", err));
  }, []);

  // Save to DB
  const save = () => {
    const token = localStorage.getItem("token");   // ✅ add this line
    const updates = Object.entries(draft).map(([metric, obj]) => ({
      metric,
      selectedType: obj.selectedType ?? "NA",
      alertMin: obj.alertMin ?? null,
      alertMax: obj.alertMax ?? null,
    }));


    fetch(apiUrl("/api/graph-settings"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ updates }),
    })
      .then((res) => res.json())
      .then(() => {
        console.log("Settings saved to DB");
      })
      .catch((err) => console.error("Failed to save graph settings:", err));
  };

  // filtered list
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rows;
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(f) ||
        r.key.toLowerCase().includes(f)
    );
  }, [rows, filter]);

  // actions
  const handleChange = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const resetToDefaults = () => {
    const next = {};
    for (const r of rows) {
      next[r.key] = {
        selectedType: r.defaultType,
        alertMin: r.alertMin ?? null,
        alertMax: r.alertMax ?? null,
      };
    }
    setDraft(next);
  };

  const bulkApply = (type) => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const r of filtered) {
        next[r.key] = {
          ...prev[r.key],
          selectedType: type,   // ✅ only update selectedType
        };
      }
      return next;
    });
  };

  return (
    <Box className="gs-wrap">
      <Card className="gs-card">
        <CardHeader
          title="Graph Settings"
          subheader="Choose how each metric appears on dashboards"
          action={
            <Tooltip title="Reset all to defaults">
              <IconButton onClick={resetToDefaults}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <Divider />
        <CardContent className="gs-content">
          {/* Sticky Tools */}
          <Box className="gs-tools">
            <TextField
              size="small"
              placeholder="Search metrics…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box className="gs-bulk">
              <Tooltip title="Apply to all filtered">
                <DoneAllIcon className="gs-bulk-icon" />
              </Tooltip>
              <Button size="small" onClick={() => bulkApply("Line")}>Line</Button>
              <Button size="small" onClick={() => bulkApply("Value")}>Value</Button>
              <Button size="small" onClick={() => bulkApply("NA")}>N/A</Button>
            </Box>
          </Box>

          {/* Header row */}
          <Box className="gs-row gs-head">
            <span>Metric</span>
            <span className="gs-col-default">Default</span>
            <span>Selected</span>
            <span className="gs-col-alert">Alert Min</span>
            <span className="gs-col-alert">Alert Max</span>
            <span className="gs-col-more">Avg (sec)</span>
          </Box>

          {/* Data rows */}
          <Box className="gs-list">
            {filtered.map((r) => (

              <Box className="gs-row">
                <Box className="gs-metric">
                  <Typography variant="body2" fontWeight={600}>
                    {r.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.key}
                  </Typography>
                </Box>

                <Box className="gs-default">{typeChip(r.defaultType)}</Box>

                <Box className="gs-select">
                  <Select
                    size="small"
                    value={draft[r.key]?.selectedType ?? r.defaultType}
                    onChange={(e) =>
                      handleChange(r.key, { ...draft[r.key], selectedType: e.target.value })
                    }
                  >
                    {TYPES.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* 🔹 Alert Min */}
                <Box className="gs-col-alert">
                  <TextField
                    size="small"
                    type="number"
                    value={draft[r.key]?.alertMin ?? metricsConfig[r.key]?.alertMin ?? ""}
                    onChange={(e) =>
                      handleChange(r.key, { ...draft[r.key], alertMin: Number(e.target.value) })
                    }
                    sx={{ width: 80 }}
                  />
                </Box>

                {/* 🔹 Alert Max */}
                <Box className="gs-col-alert">
                  <TextField
                    size="small"
                    type="number"
                    value={draft[r.key]?.alertMax ?? metricsConfig[r.key]?.alertMax ?? ""}
                    onChange={(e) =>
                      handleChange(r.key, { ...draft[r.key], alertMax: Number(e.target.value) })
                    }
                    sx={{ width: 80 }}
                  />
                </Box>

                <Box className="gs-more">
                  {r.avgSec ? (
                    <Chip size="small" label={`${r.avgSec}s`} />
                  ) : (
                    <Chip size="small" variant="outlined" label="—" />
                  )}
                </Box>
              </Box>

            ))}

            {!filtered.length && (
              <Box className="gs-empty">
                <Typography variant="body2">No metrics match your search.</Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        <Divider />
        <CardActions className="gs-footer">
          <Box display="flex" alignItems="center" gap={1}>
            <InfoOutlinedIcon fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              “Value” = tile only • “Line” = chart + tile • “N/A” = hidden
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={resetToDefaults}
          >
            Reset to defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
          >
            Save
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
