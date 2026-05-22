import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Container, Card, CardContent, Typography, Divider, Grid,
  TextField, Button, CircularProgress, Snackbar, Alert, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  InputAdornment, IconButton
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

const CodeInput = ({ label, value, onChange, helper }) => (
  <TextField
    label={label}
    value={value}
    onChange={(e)=>onChange(e.target.value)}
    size="small"
    inputProps={{ maxLength: 2 }}
    helperText={helper}
    fullWidth
  />
);

export default function DevicePrefixes() {
  const { token } = useAuth();
  const [tab, setTab] = useState(0);

  // Create Prefix form state
  const [deviceNameCode, setDeviceNameCode] = useState('');
  const [manufacturerCode, setManufacturerCode] = useState('');
  const [sectorCode, setSectorCode] = useState('');
  const [technologyCode, setTechnologyCode] = useState('');
  const [portsCode, setPortsCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState(null);
  const [calcPrefix, setCalcPrefix] = useState('');
  const [creating, setCreating] = useState(false);

  // List/search state
  const [qDeviceName, setQDeviceName] = useState('');
  const [qManufacturer, setQManufacturer] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loadingList, setLoadingList] = useState(false);

  const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });

  const codesReady = useMemo(() => (
    /^\d{2}$/.test(deviceNameCode) &&
    /^\d{2}$/.test(manufacturerCode) &&
    /^\d{1}$/.test(sectorCode) &&
    /^\d{1}$/.test(technologyCode) &&
    /^\d{1}$/.test(portsCode)
  ), [deviceNameCode, manufacturerCode, sectorCode, technologyCode, portsCode]);

  // Live validate (debounced)
  useEffect(() => {
    let active = true;
    if (!codesReady) { setExists(null); setCalcPrefix(''); return; }

    const run = async () => {
      try {
        setChecking(true);
        const url = new URL('https://admin.dozemate.com/api/device-prefixes/validate');
        url.searchParams.set('deviceNameCode', deviceNameCode);
        url.searchParams.set('manufacturerCode', manufacturerCode);
        url.searchParams.set('sectorCode', sectorCode);
        url.searchParams.set('technologyCode', technologyCode);
        url.searchParams.set('portsCode', portsCode);

        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!active) return;
        setExists(json.exists);
        setCalcPrefix(json.prefix || '');
      } catch (e) {
        if (!active) return;
        setExists(null);
        setCalcPrefix('');
      } finally {
        if (active) setChecking(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => { active = false; clearTimeout(t); };
  }, [codesReady, deviceNameCode, manufacturerCode, sectorCode, technologyCode, portsCode, token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!codesReady) {
      setSnackbar({ open:true, message:'Please fill all codes correctly.', severity:'warning' });
      return;
    }
    if (exists) {
      setSnackbar({ open:true, message:`Prefix ${calcPrefix} already exists.`, severity:'error' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('https://admin.dozemate.com/api/device-prefixes', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceNameCode, manufacturerCode, sectorCode, technologyCode, portsCode })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create prefix');

      setSnackbar({ open:true, message:`Prefix ${json?.data?.prefix} created.`, severity:'success' });
      // reset
      setDeviceNameCode(''); setManufacturerCode(''); setSectorCode('');
      setTechnologyCode(''); setPortsCode(''); setExists(null); setCalcPrefix('');
    } catch (e) {
      setSnackbar({ open:true, message:String(e.message || e), severity:'error' });
    } finally {
      setCreating(false);
    }
  };

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const url = new URL('https://admin.dozemate.com/api/device-prefixes');
      if (qDeviceName) url.searchParams.set('deviceName', qDeviceName);
      if (qManufacturer) url.searchParams.set('manufacturer', qManufacturer);
      if (q) url.searchParams.set('q', q);
      url.searchParams.set('page', String(page+1));
      url.searchParams.set('limit', String(limit));

      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch');
      setRows(json.data || []);
      setTotal(json.total || 0);
    } catch (e) {
      setSnackbar({ open:true, message:String(e.message || e), severity:'error' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { if (tab === 1) fetchList(); }, [tab, page, limit]);

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ mb: 2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Typography variant="h4">Device Prefixes</Typography>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)}>
          <Tab label="Create Prefix" />
          <Tab label="Show Prefixes" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom><AddIcon sx={{ mr:1, verticalAlign:'middle' }} />Create 7‑digit Prefix</Typography>
            <Divider sx={{ mb:2 }} />

            <form onSubmit={handleCreate}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><CodeInput label="Device Name Code (01..06)" value={deviceNameCode} onChange={setDeviceNameCode} helper="e.g., 01 for Dozemate" /></Grid>
                <Grid item xs={12} md={4}><CodeInput label="Manufacturer Code (01..04)" value={manufacturerCode} onChange={setManufacturerCode} helper="e.g., 02 for Slimiot" /></Grid>
                <Grid item xs={12} md={4}><CodeInput label="Sector Code (0..6)" value={sectorCode} onChange={setSectorCode} helper="0: Medical, 1: Env, ..." /></Grid>
                <Grid item xs={12} md={4}><CodeInput label="Technology Code (0..6)" value={technologyCode} onChange={setTechnologyCode} helper="0: BLE, 1: WiFi, ..." /></Grid>
                <Grid item xs={12} md={4}><CodeInput label="Ports Code (0..6)" value={portsCode} onChange={setPortsCode} helper="0: I2C, 1: SPI, ..." /></Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mt:1 }}>
                    {checking ? 'Checking...' :
                      (codesReady
                        ? (exists === true
                          ? <>❌ Already exists: <b>{calcPrefix}</b></>
                          : exists === false
                            ? <>✅ Available: will create <b>{calcPrefix}</b></>
                            : 'Fill all codes to validate')
                        : 'Fill all codes to validate')}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" disabled={!codesReady || exists || creating}>
                    {creating ? <CircularProgress size={20} /> : 'Create Prefix'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display:'flex', gap:2, alignItems:'center', mb:2, flexWrap:'wrap' }}>
              <TextField size="small" label="Device Name" value={qDeviceName} onChange={e=>setQDeviceName(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
              <TextField size="small" label="Manufacturer" value={qManufacturer} onChange={e=>setQManufacturer(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
              <TextField size="small" label="Search (prefix/name/manufacturer)" value={q} onChange={e=>setQ(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
              <Button startIcon={<RefreshIcon />} onClick={fetchList} disabled={loadingList}>Refresh</Button>
            </Box>

            {loadingList ? <CircularProgress /> : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prefix</TableCell>
                      <TableCell>Device Name</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>Sector</TableCell>
                      <TableCell>Technology</TableCell>
                      <TableCell>Ports</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Sample</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(rows || []).length === 0 && (
                      <TableRow><TableCell colSpan={8} align="center">No prefixes found</TableCell></TableRow>
                    )}
                    {(rows || []).map(r => (
                      <TableRow key={r._id}>
                        <TableCell>{r.prefix}</TableCell>
                        <TableCell>{r.deviceName}</TableCell>
                        <TableCell>{r.manufacturer}</TableCell>
                        <TableCell>{r.sector}</TableCell>
                        <TableCell>{r.technology}</TableCell>
                        <TableCell>{r.ports}</TableCell>
                        <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{r.prefix}-XXXX</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={(_, p)=>setPage(p)}
                  rowsPerPage={limit}
                  onRowsPerPageChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(0); }}
                  rowsPerPageOptions={[5,10,25,50]}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={()=>setSnackbar(s=>({ ...s, open:false }))}>
        <Alert severity={snackbar.severity} onClose={()=>setSnackbar(s=>({ ...s, open:false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
