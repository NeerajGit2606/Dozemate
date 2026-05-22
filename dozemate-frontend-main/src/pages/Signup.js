// src/pages/Signup.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  FiUser, FiHome, FiMapPin, FiPhone, FiMail, FiGrid, FiPlus, FiTrash2, FiCamera, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo
} from 'react-icons/fi';

import './Signup.css';
import { apiUrl } from "../config/api";
import { FiGithub } from 'react-icons/fi'; // optional icons
import { FcGoogle } from 'react-icons/fc'; // google icon

const OFFLINE_DEVICE_MODE = false;
// small map to auto-fill country from dialing code
const CC_TO_COUNTRY = {
  '+91': 'India',
  '+1': 'United States',
  '+44': 'United Kingdom',
  '+61': 'Australia',
  '+81': 'Japan',
  '+971': 'United Arab Emirates',
};

// ── Device ID dictionaries (from spec screenshots)
const DEVICE_NAME_CODES = {
  '01': 'Dozemate',
  '02': 'Sensabit',
  '03': 'Smart ring',
  '04': 'GPSsmart',
  '05': 'Stethopod',
  '06': 'Environment',
};

const MANUFACTURER_CODES = {
  '01': 'ABC corp',
  '02': 'Slimiot',
  '03': 'Sensabit',
  '04': 'Dozemate',
};

const TECHNOLOGY_CODES = {
  '0': 'BLE',
  '1': 'Wifi',
  '2': 'BLE+Wifi',
  '3': 'UWB',
  '4': 'GPS/GNSS',
  '5': 'UWB+GPS',
};

const PORT_CODES = {
  '0': 'UART',
  '1': 'I2C',
  '2': 'SPI',
  '3': 'UART+I2C',
  '4': 'UART+SPI',
  '5': 'I2C+SPI',
  '6': 'I2C+SPI+UART',
};

// Accepts 7 digits + optional A–Z revision, then -, then 4–6 A–Z/0–9
const DEVICE_ID_PATTERN = /^(\d{4})-([0-9A-F]{12})$/i;

const normalizeDeviceIdFull = (s) => (s || '').trim().toUpperCase();

// Toggle this to silence logs in production
const INVITE_ENDPOINT = '/api/auth/register';
const DEBUG_SIGNUP = true;
const dbg = (...args) => { if (DEBUG_SIGNUP) console.log('[Signup]', ...args); };

// Accept `codes` and fallback to hard-coded maps if not loaded yet

function decodeDeviceIdParts(fullId, codes) {
  const norm = normalizeDeviceIdFull(fullId);

  // --- Try new format: 4 digits + 12 hex
  let m = norm.match(/^(\d{4})-([0-9A-F]{12})$/i);
  if (m) {
    const prefix = m[1];
    const uniquePart = m[2];
    const d12 = prefix.slice(0, 2);
    const d34 = prefix.slice(2, 4);

    const modelsByCode = codes?.modelsByCode ??
      Object.fromEntries(Object.entries(DEVICE_NAME_CODES).map(([k, v]) => [k, { id: null, name: v }]));
    const manufacturersByCode = codes?.manufacturersByCode ??
      Object.fromEntries(Object.entries(MANUFACTURER_CODES).map(([k, v]) => [k, { id: null, name: v }]));

    const typeRec = modelsByCode[d12];
    const mfrRec = manufacturersByCode[d34];
    const problems = [];
    if (!typeRec) problems.push(`Unknown Device code "${d12}"`);
    if (!mfrRec) problems.push(`Unknown Manufacturer code "${d34}"`);

    return {
      ok: problems.length === 0,
      error: problems.length ? problems.join('; ') : null,
      meta: {
        firstPart: prefix,
        uniquePart,
        revision: null,
        typeCode: d12,
        manufacturerCode: d34,
        techCode: null,
        portsCode: null,
        variantCode: null,
        type: typeRec?.name || null,
        manufacturer: mfrRec?.name || null,
        technology: null,
        ports: null,
        deviceModelId: typeRec?.id || null,
        manufacturerId: mfrRec?.id || null,
      }
    };
  }

  // --- Fallback: old format (7 digits + optional revision)
  m = norm.match(/^(\d{7}[A-Z]?)-([A-Z0-9]{4,6})$/i);
  if (!m) {
    return { ok: false, error: 'Format must be like 1234567-999ABC, 1234567A-999ABC, or 0102-ACDE48112233' };
  }
  const first = m[1];
  const second = m[2];
  const firstNoRev = first.replace(/[A-Z]$/, '');
  const revision = /[A-Z]$/.test(first) ? first.slice(-1) : null;

  const d12 = firstNoRev.slice(0, 2);
  const d34 = firstNoRev.slice(2, 4);
  const d5 = firstNoRev[4];
  const d6 = firstNoRev[5];
  const d7 = firstNoRev[6];

  const modelsByCode = codes?.modelsByCode ??
    Object.fromEntries(Object.entries(DEVICE_NAME_CODES).map(([k, v]) => [k, { id: null, name: v }]));
  const manufacturersByCode = codes?.manufacturersByCode ??
    Object.fromEntries(Object.entries(MANUFACTURER_CODES).map(([k, v]) => [k, { id: null, name: v }]));
  const technologiesByCode = codes?.technologiesByCode ?? TECHNOLOGY_CODES;
  const portsByCode = codes?.portsByCode ?? PORT_CODES;

  const typeRec = modelsByCode[d12];
  const mfrRec = manufacturersByCode[d34];
  const techName = technologiesByCode[d5];
  const portName = portsByCode[d6];

  const problems = [];
  if (!typeRec) problems.push(`Unknown Device code "${d12}"`);
  if (!mfrRec) problems.push(`Unknown Manufacturer code "${d34}"`);
  if (!techName) problems.push(`Unknown Technology code "${d5}"`);
  if (!portName) problems.push(`Unknown Ports code "${d6}"`);

  return {
    ok: problems.length === 0,
    error: problems.length ? problems.join('; ') : null,
    meta: {
      firstPart: first,
      uniquePart: second,
      revision,
      typeCode: d12,
      manufacturerCode: d34,
      techCode: d5,
      portsCode: d6,
      variantCode: d7,
      type: typeRec?.name || null,
      manufacturer: mfrRec?.name || null,
      technology: techName || null,
      ports: portName || null,
      deviceModelId: typeRec?.id || null,
      manufacturerId: mfrRec?.id || null,
    }
  };
}


// Helper to POST a new subordinate user (admin token required)
async function postCreateUser(newUser, token) {
  // Adjust field names only if your controller expects different keys.
  const payload = {
    role: 'user',
    email: newUser.email.trim(),
    name: [newUser.firstName?.trim(), newUser.lastName?.trim()].filter(Boolean).join(' '),
    pincode: String(newUser.pincode || '').trim(),
    mobile: String(newUser.mobile || '').replace(/\D/g, '').replace(/^0+/, ''),
    countryCode: newUser.countryCode || '+91',
    country: newUser.country || 'India',
    city: newUser.city?.trim(),
    address: newUser.address || ''
  };

  const url = apiUrl(INVITE_ENDPOINT);
  dbg('ADD-USER →', url, payload);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  dbg('ADD-USER ←', res.status, res.statusText, json);
  // Treat 200/201/202/204 as success. If your API returns 409 for "already exists" and still emails, include it:
  const ok = res.ok || [200, 201, 202, 204, 409].includes(res.status);
  return { ok, status: res.status, json };
}


async function checkDeviceAvailability(fullId) {
  const q = encodeURIComponent(fullId);
  const urls = [
    apiUrl(`/api/devices/public/available?deviceId=${q}`),
    apiUrl(`/api/devices/validate?deviceId=${q}`),
  ];

  console.groupCollapsed('[Signup] checkDeviceAvailability', fullId);
  console.time('[Signup] deviceAvailability');

  for (const url of urls) {
    try {
      dbg('→ GET', url);
      const r = await fetch(url);
      dbg('← status', r.status, r.statusText);

      if (!r.ok) {
        dbg('response not OK, trying next URL');
        continue;
      }

      const j = await r.json();
      dbg('payload', j);

      let device = j.device ?? j.data?.device ?? j.data ?? null;
      const exists = (j.exists ?? j.data?.exists ?? (device ? true : false)) === true;
      if (DEBUG_SIGNUP) { console.groupCollapsed('[Signup] checkDeviceAvailability', fullId); console.time('[Signup] deviceAvailability'); }
      const assigned = (j.assigned ?? j.data?.assigned ?? !!device?.userId) === true;

      // 🔹 If exists=true but device record is missing basic fields, fetch full record
      if (exists && (!device || !device.firmwareVersion)) {
        try {
          const dRes = await fetch(apiUrl(`/api/devices/by-id/${q}`));
          if (dRes.ok) {
            const dJson = await dRes.json().catch(() => ({}));
            device = dJson.device ?? dJson.data ?? device;
            dbg('fetched full device record', device);
          }
        } catch (err2) {
          dbg('error fetching full device details', err2);
        }
      }


      console.timeEnd('[Signup] deviceAvailability');
      console.groupEnd();
      return { ok: true, exists, assigned, device };
    } catch (err) {
      dbg('error checking', url, err);
    }
  }

  console.timeEnd('[Signup] deviceAvailability');
  console.groupEnd();
  return { ok: false, exists: null, assigned: null, device: null };
}


function AsyncUserSelect({ value, onChange, placeholder = 'Allot device to (User) e.g' }) {
  const [q, setQ] = React.useState(value || '');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    setQ(value || '');
    if (!value) { setOpen(false); setItems([]); }
  }, [value]);

  React.useEffect(() => {
    if (!q || q.length < 2) { setItems([]); return; }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {

      const batchId = window.__signupBatchId || "default";
      const url = apiUrl(`/api/public/pending-users?batchId=${encodeURIComponent(batchId)}&q=${encodeURIComponent(q)}`);

      try {
        setLoading(true);
        dbg('UserSuggest →', url);
        const r = await fetch(url, { signal: ctrl.signal });
        dbg('UserSuggest status ←', r.status, r.statusText);
        const j = await r.json().catch(() => ({ data: [] }));
        dbg('UserSuggest payload', j);
        setItems(Array.isArray(j.data) ? j.data : []);
      } catch (e) {
        dbg('UserSuggest error', e);
      } finally {
        setLoading(false);
        setOpen(true);
      }
    }, 300);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  return (
    <div className="input-container typeahead">
      <FiUser className="input-icon" />
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => q.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && (
        <div className="typeahead-menu">
          {loading && <div className="typeahead-item muted">Searching…</div>}
          {!loading && items.length === 0 && q.length >= 2 && (
            <div className="typeahead-item muted">No matches</div>
          )}
          {items.map(u => (
            <div
              key={u._id}
              className="typeahead-item"
              onMouseDown={() => { onChange(u.email); setQ(u.email); setOpen(false); }}
            >
              <div className="ti-primary">{u.email}</div>
              {u.name ? <div className="ti-secondary">{u.name}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function DeviceIdPreview({ decode, statusMsg, device }) {
  const hasDecode = !!decode?.meta;
  const hasServer = !!device;
  if (!hasDecode && !hasServer) return null;

  // Status pill
  let status = { tone: 'neutral', icon: <FiInfo />, label: statusMsg || '—' };
  const m = (statusMsg || '').toLowerCase();
  if (m.includes('available') || m.includes('format ok')) {
    status = { tone: 'good', icon: <FiCheckCircle />, label: statusMsg || 'Available' };
  }
  else if (m.includes('not found')) status = { tone: 'warn', icon: <FiAlertTriangle />, label: 'Not found' };
  else if (m.includes('already')) status = { tone: 'bad', icon: <FiXCircle />, label: 'Already allotted' };
  else if (m.includes('could not verify')) status = { tone: 'neutral', icon: <FiInfo />, label: 'Server check pending' };
  else if (decode?.error) status = { tone: 'bad', icon: <FiXCircle />, label: decode.error };

  // Tags (prefer decode mapping; fallback to server fields)
  const tags = {
    type: hasDecode ? decode.meta.type : (device?.deviceType || '—'),
    mfr: hasDecode ? decode.meta.manufacturer : (device?.manufacturer || '—'),
    tech: hasDecode ? decode.meta.technology : '—',
    ports: hasDecode ? decode.meta.ports : '—',
    rev: hasDecode ? (decode.meta.revision || '—') : '—',
  };

  // Rows for the labeled grid
  let rows;
  if (hasServer) {
    const expired = device?.validity && new Date(device.validity) < new Date();
    rows = [
      ['Device ID', device.deviceId],
      ['Device Type', device.deviceType],
      ['Manufacturer', device.manufacturer],
      ['Firmware', device.firmwareVersion || '—'],
      ['Location', device.location || '—'],
      [
        'Status',
        <span key="st" className={`value-badge ${String(device.status || '').toLowerCase() === 'active' ? 'ok' : 'bad'}`}>
          {device.status || '—'}
        </span>
      ],
      ['Last Active', device.lastActiveAt ? new Date(device.lastActiveAt).toLocaleString() : '—'],
      [
        'Expiry',
        <span key="ex" className={`value-badge ${expired ? 'bad' : 'muted'}`}>
          {device.validity ? new Date(device.validity).toLocaleDateString() : '—'}
        </span>
      ],
    ];
  } else {
    // decode-only
    rows = [
      ['Device Type', tags.type],
      ['Manufacturer', tags.mfr],
      ['Firmware', device?.firmwareVersion || '—'],
      ['Location', device?.location || '—'],
      [
        'Status',
        <span key="st" className={`value-badge ${String(device?.status || '').toLowerCase() === 'active' ? 'ok' : 'bad'}`}>
          {device?.status || '—'}
        </span>
      ],
      ['Last Active', device?.lastActiveAt ? new Date(device.lastActiveAt).toLocaleString() : '—'],
      [
        'Expiry',
        <span key="ex" className={`value-badge ${device?.validity && new Date(device.validity) < new Date() ? 'bad' : 'muted'}`}>
          {device?.validity ? new Date(device.validity).toLocaleDateString() : '—'}
        </span>
      ],
    ];
  }

  return (
    <div className="device-preview">

      {/* Labeled info grid */}
      <div className="kv-list">
        {rows.map(([k, v]) => (
          <div className="kv" key={k}>
            <div className="kv__label">{k}</div>
            <div className="kv__value">{v}</div>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div className={`status-chip status-chip--${status.tone}`}>
        {status.icon}<span>{status.label}</span>
      </div>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [addedUserIds, setAddedUserIds] = useState([]);
  // ── Role
  const [role, setRole] = useState('user'); // 'user' | 'admin' | 'superadmin'

  // ── Core profile (sheet order)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [house, setHouse] = useState('');   // House / Building
  const [street, setStreet] = useState(''); // Street
  const [city, setCity] = useState('');     // auto on pincode

  // ── Weight profile (User/Admin only)
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' | 'inch'
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' | 'lb'
  const [waist, setWaist] = useState('');
  const [waistUnit, setWaistUnit] = useState('cm');   // 'cm' | 'inch'
  const [dob, setDob] = useState('');                 // OR age
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');           // 'female' | 'male' | 'undisclosed' | ''

  // ── Devices (User/Admin; superadmin has separate assign area later)
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [allotToInput, setAllotToInput] = useState('');
  const [devices, setDevices] = useState([]); // [{ id, allotTo }]
  const [gridX, setGridX] = useState(3);
  const [gridY, setGridY] = useState(2);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const [displayIds, setDisplayIds] = useState(new Set());

  // ── Super Admin extras
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhoneCC, setCompanyPhoneCC] = useState('+91');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyCountry, setCompanyCountry] = useState('India');
  const [companyPincode, setCompanyPincode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [sendInfoTo, setSendInfoTo] = useState('');

  // ── UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [deviceDecode, setDeviceDecode] = useState(null); // { ok, error, meta }
  const [deviceCheckMsg, setDeviceCheckMsg] = useState('');
  const [deviceServer, setDeviceServer] = useState(null); // server-returned device object (or null)
  const [codes, setCodes] = useState(null);
  const [roleNotice, setRoleNotice] = useState('');
  const [allotIdentifier, setAllotIdentifier] = useState('');

  // --- Add User sub-form (Admin adds members) ---
  const [auIdentifier, setAuIdentifier] = useState('');
  const [auFirst, setAuFirst] = useState('');
  const [auLast, setAuLast] = useState('');
  const [auEmail, setAuEmail] = useState('');
  const [auCC, setAuCC] = useState('+91');
  const [auMobile, setAuMobile] = useState('');
  const [auCountry, setAuCountry] = useState('India');
  const [auPincode, setAuPincode] = useState('');
  const [auHouse, setAuHouse] = useState('');
  const [auStreet, setAuStreet] = useState('');
  const [auCity, setAuCity] = useState('');

  // list of users admin is adding
  const [usersToAdd, setUsersToAdd] = useState([]);

  const [addUserLoading, setAddUserLoading] = useState(false);
  const [editUserIndex, setEditUserIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ── Profiles
  const [profiles, setProfiles] = useState([]); // [{ name, deviceIds: [] }]
  const [selectedProfile, setSelectedProfile] = useState('');
  const [highlightProfile, setHighlightProfile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [showDeviceDetails, setShowDeviceDetails] = useState(true);

  // cc→country auto for Add User
  useEffect(() => { setAuCountry(CC_TO_COUNTRY[auCC] || ''); }, [auCC]);

  // pincode→city auto for Add User
  const handleAuPinBlur = async () => {
    const pin = (auPincode || '').trim();
    if (pin.length < 4) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
      const json = await res.json();
      const office = json?.[0]?.PostOffice?.[0];
      if (office?.District) setAuCity(office.District);
    } catch {/* noop */ }
  };

  // OKAY for Add User (validates & pushes to list)
  const handleAddUserOkayOld = async () => {
    // minimal validation like you already had
    if (!auFirst.trim() || !auEmail.trim() || !auPincode.trim() || !auCity.trim() || !auMobile.trim()) {

      console.warn('[Signup] AddUser validation failed', { auFirst, auEmail, auPincode, auCity });
      return;
    }

    // Build payload to match your backend model
    const cleaned = auMobile.replace(/\D/g, '').replace(/^0+/, '');
    const newUser = {
      identifier: auIdentifier || undefined,
      firstName: auFirst.trim(),
      lastName: auLast.trim() || undefined,
      email: auEmail.trim(),
      countryCode: auCC,
      mobile: cleaned || undefined,
      country: auCountry || undefined,
      pincode: auPincode.trim() || undefined,
      address: [auHouse, auStreet].filter(Boolean).join(', ') || undefined,
      city: auCity.trim() || undefined,
    };

    // Must be logged in as Admin (route is auth + admin)
    const token = null; // localStorage.getItem('token'); 

    setAddUserLoading(true);
    setError('');
    setInfo('');

    try {

      let ok = true, status = 200, json = {};
      if (isEditing && editUserIndex !== null) {
        // 🔹 Update flow
        console.log("[Signup] Updating user record →", newUser);

        const targetUser = usersToAdd[editUserIndex];
        if (!targetUser || !targetUser._id) {
          console.error("[Signup] No _id found for user, cannot update", targetUser);
          setError("Cannot update user: missing user ID");
          setAddUserLoading(false);
          return;
        }

        const updateUrl = apiUrl(`/api/users/${targetUser._id}`);
        const res = await fetch(updateUrl, {

          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser),
        });
        status = res.status;
        json = await res.json().catch(() => ({}));
        ok = res.ok;

        if (ok) {
          setUsersToAdd(prev => {
            const updated = [...prev];
            updated[editUserIndex] = { ...updated[editUserIndex], ...newUser };
            return updated;
          });
          setIsEditing(false);
          setEditUserIndex(null);
        }
      } else {
        // 🔹 Add flow (existing)
        const result = await postCreateUser(newUser, token);
        ok = result.ok; status = result.status; json = result.json;
        if (ok) {
          const createdId =
            json?.user?.id || json?.data?.user?.id || json?.user?._id || json?.data?._id;
          if (createdId) {
            const userWithId = { ...newUser, _id: createdId };
            setUsersToAdd(prev => [...prev, userWithId]);
          }
        }
      }

      const createdId =
        json?.user?.id || json?.data?.user?.id || json?.user?._id || json?.data?._id;
      if (createdId) setAddedUserIds(prev => [...prev, createdId]);
      if (!ok) {
        if (status === 401 || status === 403) {
          setError('Not authorized. Please login as Admin to add users.');
        } else {
          setError(json?.message || `Add User failed (${status}).`);
        }
        return;
      }

      setInfo(`Invite email sent to ${newUser.email}`);
      setTimeout(() => setInfo(''), 2500);

      // 🔹 Add profile auto from identifier
      if (newUser.identifier) {
        setProfiles(prev => [
          ...prev,
          { name: newUser.identifier, deviceIds: [] }
        ]);
      }
      // clear sub-form
      setAuIdentifier('');
      setAuFirst('');
      setAuLast('');
      setAuEmail('');
      setAuCC('+91');
      setAuMobile('');
      setAuCountry('India');
      setAuPincode('');
      setAuHouse('');
      setAuStreet('');
      setAuCity('');

    } catch (err) {
      console.error('[Signup] Add User exception', err);
      setError('Network error while inviting user.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleAddUserOkay = async () => {
    if (!auFirst.trim() || !auEmail.trim() || !auPincode.trim() || !auCity.trim() || !auMobile.trim()) {
      console.warn('[Signup] AddUser validation failed');
      return;
    }

    const cleaned = auMobile.replace(/\D/g, '').replace(/^0+/, '');
    const newUser = {
      identifier: auIdentifier || undefined,
      firstName: auFirst.trim(),
      lastName: auLast.trim() || undefined,
      email: auEmail.trim(),
      countryCode: auCC,
      mobile: cleaned || undefined,
      country: auCountry || undefined,
      pincode: auPincode.trim() || undefined,
      address: [auHouse, auStreet].filter(Boolean).join(', ') || undefined,
      city: auCity.trim() || undefined,
    };

    try {
      // 🔹 same API works for add & update
      const res = await fetch(apiUrl('/api/public/pending-users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: 'default', user: newUser }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.data) {
        if (isEditing && editUserIndex !== null) {
          // 🔹 replace in local state
          setUsersToAdd(prev => {
            const updated = [...prev];
            updated[editUserIndex] = { ...newUser, _id: json.data._id };
            return updated;
          });
          setIsEditing(false);
          setEditUserIndex(null);
        } else {
          // 🔹 append to local state
          setUsersToAdd(prev => [...prev, { ...newUser, _id: json.data._id }]);
        }
      } else {
        console.error('[Signup] PendingUser save failed', json);
      }
    } catch (err) {
      console.error('[Signup] Network error saving PendingUser', err);
    }

    // clear form
    setAuIdentifier('');
    setAuFirst('');
    setAuLast('');
    setAuEmail('');
    setAuCC('+91');
    setAuMobile('');
    setAuCountry('India');
    setAuPincode('');
    setAuHouse('');
    setAuStreet('');
    setAuCity('');
  };

  // auto-dismiss success/info messages
  useEffect(() => {
    if (info) {
      const timer = setTimeout(() => {
        setInfo('');
      }, 3000); // 3 seconds
      return () => clearTimeout(timer); // cleanup if component unmounts
    }
  }, [info]);


  useEffect(() => {
    const cap = gridX * gridY;
    if (displayIds.size > cap) {
      const trimmed = new Set([...displayIds].slice(0, cap));
      setDisplayIds(trimmed);
    }
  }, [gridX, gridY]); // eslint-disable-line

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiUrl('/api/public/codes'));
        const j = await r.json();
        setCodes(j);
      } catch {
        setCodes(null); // fall back to current hard-coded maps if you like
      }
    })();
  }, []);

  // auto country from dialing code
  useEffect(() => {
    setCountry(CC_TO_COUNTRY[countryCode] || '');
  }, [countryCode]);

  // auto country for superadmin's company block
  useEffect(() => {
    setCompanyCountry(CC_TO_COUNTRY[companyPhoneCC] || '');
  }, [companyPhoneCC]);

  useEffect(() => {
    if (role === 'user' && devices.length > 1) {
      setRole('admin');
      setRoleNotice('More than one device added — role switched to Admin.');
    }
  }, [devices.length, role]);

  useEffect(() => {
    (async () => {
      try {
        console.log('[Signup] Fetching organizations...');
        const r = await fetch(apiUrl('/api/public/organizations'));
        const j = await r.json();
        console.log('[Signup] Organizations response:', j);
        if (j?.data?.organizations) {
          setOrganizations(j.data.organizations);
        }
      } catch (err) {
        console.error('[Signup] Error fetching organizations', err);
      }
    })();
  }, []);


  // clean 0-prefix from mobile on blur
  const cleanedMobile = useMemo(
    () => mobile.replace(/\D/g, '').replace(/^0+/, ''),
    [mobile]
  );
  const handleMobileBlur = () => setMobile((m) => m.replace(/^0+/, ''));

  // pincode → city (simple helper; keep manual if fails)
  const handlePincodeBlur = async () => {
    const pin = (pincode || '').trim();
    if (pin.length < 4) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
      const json = await res.json();
      const office = json?.[0]?.PostOffice?.[0];
      if (office?.District) setCity(office.District);
    } catch {
      /* keep manual */
    }
  };

  const handleCompanyPincodeBlur = async () => {
    const pin = (companyPincode || '').trim();
    if (pin.length < 4) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
      const json = await res.json();
      const office = json?.[0]?.PostOffice?.[0];
      if (office?.District) setCompanyCity(office.District);
    } catch {
      /* keep manual */
    }
  };

  // ── devices
  const totalSlots = gridX * gridY;
  const pagedDevices = useMemo(() => devices.slice(0, totalSlots), [devices, totalSlots]);

  const stepSeries = (dir) => {
    setSeriesIndex((i) => {
      const next = i + dir;
      if (next < 0) return Math.max(0, pagedDevices.length - 1);
      if (next >= pagedDevices.length) return 0;
      return next;
    });
  };

  const addDevice = async () => {
    setError('');
    const fullIdRaw = deviceIdInput;
    if (!fullIdRaw?.trim()) {
      console.warn('[Signup] addDevice blocked: empty Device ID');
      return setError('Enter Device ID');
    }

    if (role !== 'user' && !allotToInput?.trim()) {
      console.warn('[Signup] addDevice blocked: empty allotTo for non-user role');
      return setError('Enter "Allot device to (User)"');
    }

    const dec = decodeDeviceIdParts(fullIdRaw, codes);
    dbg('addDevice decode →', dec);
    if (!dec.ok) return setError(dec.error || 'Invalid device code');

    const fullId = normalizeDeviceIdFull(fullIdRaw);
    const allot = role === 'user' ? (email || 'self') : allotToInput.trim();

    if (devices.some(d => normalizeDeviceIdFull(d.id) === fullId)) {
      console.warn('[Signup] addDevice blocked: duplicate in list', fullId);
      return setError('This Device ID is already in the list.');
    }

    let statusActive = false;
    let serverDevice = null;

    if (!OFFLINE_DEVICE_MODE) {
      dbg('addDevice server check →', fullId);
      const { ok, exists, assigned, device } = await checkDeviceAvailability(fullId);
      dbg('addDevice server check ←', { ok, exists, assigned, device });
      serverDevice = device || null;
      if (ok && exists === false) return setError('Device not found in database.');
      statusActive = (device?.status || '').toLowerCase() === 'active';
    }

    setDevices(prev => [
      ...prev,
      { id: fullId, allotTo: allot, identifier: allotIdentifier || undefined, _meta: dec.meta, active: statusActive }
    ]);
    setSeriesIndex(0);

    if (selectedProfile) {
      setProfiles(prev => prev.map(p =>
        p.name === selectedProfile
          ? { ...p, deviceIds: [...p.deviceIds, fullId] }
          : p
      ));
    }

    setDisplayIds(prev => {
      const next = new Set(prev);
      next.add(fullId);
      return next;
    });

    setDeviceIdInput('');
    if (role !== 'user') setAllotToInput('');
    setDeviceDecode(null);
    setDeviceCheckMsg('');
    setDeviceServer(serverDevice);

    dbg('addDevice ✓ added', { id: fullId, allotTo: allot, active: statusActive, meta: dec.meta });
    setShowDeviceDetails(false);
  };


  const canDisplayMore = () => displayIds.size < (gridX * gridY);

  const toggleDisplay = (id, active) => {
    setDisplayIds(prev => {
      const next = new Set(prev);
      const upId = normalizeDeviceIdFull(id);
      const has = next.has(upId);

      if (has) { next.delete(upId); return next; }
      if (!active) { setError('Only ACTIVE devices can be set to Display'); return prev; }
      if (!canDisplayMore()) { setError(`Display grid is full (max ${gridX * gridY}).`); return prev; }

      next.add(upId);
      return next;
    });
  };

  const removeDevice = (idx) => {
    setDevices((prev) => prev.filter((_, i) => i !== idx));
    setSeriesIndex(0);
    setDisplayIds(prev => {
      const next = new Set(prev);
      // remove the device id by index
      const dev = devices[idx];
      if (dev) next.delete(normalizeDeviceIdFull(dev.id));
      return next;
    });
  };

  // Only the fields that are truly mandatory in the spec
  const checkRequired = () => {
    const missing = [];

    if (!firstName?.trim()) missing.push("First name");
    if (!email?.trim()) missing.push("Email");
    if (!countryCode?.trim()) missing.push('Country code');
    if (!mobile?.trim()) missing.push('Mobile');
    if (!country?.trim()) missing.push('Country');
    if (!pincode?.trim()) missing.push("Pincode");

    return missing.length ? `Missing: ${missing.join(", ")}` : "";
  };

  // ── submit
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const validationMsg = checkRequired();
    if (validationMsg) {
      console.warn('[Signup] validation failed:', validationMsg);
      return setError(validationMsg);
    }

    if (!password.trim()) {
      alert("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      console.warn('[Signup] Password mismatch:', { password, confirmPassword });
      setError("Passwords do not match");
      return;
    }

    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    const address = [house, street].filter(Boolean).join(', ');
    const deviceIdsOnly = (devices || [])
      .map(d => (d?.id || '').trim().toUpperCase())
      .filter(Boolean);

    const weightProfile = (role !== 'superadmin')
      ? {
        height: height ? Number(height) : undefined,
        heightUnit,
        weight: weight ? Number(weight) : undefined,
        weightUnit,
        waist: waist ? Number(waist) : undefined,
        waistUnit,
        dob: dob || undefined,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
      }
      : undefined;

    const devicesPayload = devices.length
      ? devices.map(d => ({
        deviceId: normalizeDeviceIdFull(d.id),
        allotTo: d.allotTo.trim(),
        deviceModelId: d._meta?.deviceModelId ?? undefined,
        manufacturerId: d._meta?.manufacturerId ?? undefined,
        // audit/debug
        typeCode: d._meta?.typeCode,
        manufacturerCode: d._meta?.manufacturerCode,
        techCode: d._meta?.techCode,
        portsCode: d._meta?.portsCode,
        technology: d._meta?.technology,
        ports: d._meta?.ports,
        identifier: d.identifier || undefined,
      }))
      : undefined;

    const requestData = {
      name,
      organizationId: selectedOrgId || undefined,
      email,
      countryCode,
      mobile: cleanedMobile,
      country,
      pincode,
      address,
      city,
      password,
      role: role,
      devices: devicesPayload,
      activeDevice: devicesPayload?.length ? devicesPayload[0].deviceId : undefined,
      profiles: profiles.length
        ? profiles.map(p => ({
          name: p.name,
          deviceIds: p.deviceIds.map(normalizeDeviceIdFull)
        }))
        : undefined,
      displayDeviceIds: displayIds.size ? [...displayIds] : undefined,
      grid: devices.length ? { x: Number(gridX), y: Number(gridY) } : undefined,
      weightProfile,
      signupMeta: { source: 'web', version: 'v1' },
      addCompany:
        role === 'superadmin'
          ? {
            name: companyName || undefined,
            email: companyEmail || undefined,
            phoneCC: companyPhoneCC,
            phone: companyPhone || undefined,
            country: companyCountry || undefined,
            pincode: companyPincode || undefined,
            city: companyCity || undefined,
            address: companyAddress || undefined,
          }
          : undefined,
      sendInfoTo: role === 'superadmin' && sendInfoTo ? sendInfoTo : undefined,
      ...(role === 'admin' && usersToAdd.length ? { subUsers: usersToAdd } : {}),
    };

    // IMPORTANT: use the computed endpoint!
    const registerEndpoint = '/api/auth/register';

    window.__signupDeviceIds = deviceIdsOnly;
    window.__lastRegisterRequest = requestData;
    dbg('REGISTER →', registerEndpoint, requestData);

    setLoading(true);
    console.groupCollapsed('[Signup] handleSignup network');
    console.time('[Signup] total');

    try {
      // 1) Register
      const regRes = await fetch(apiUrl(registerEndpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const regJson = await regRes.json().catch(() => ({}));
      window.__lastRegisterResponse = { status: regRes.status, body: regJson };
      dbg('REGISTER status ←', regRes.status, regRes.statusText, regJson);

      const er = regJson?.emailResults || regJson?.data?.emailResults;
      if (Array.isArray(er)) {
        const ok = er.filter(x => x.ok).length;
        const failed = er.filter(x => !x.ok);
        dbg('Email results', { ok, failed });
        setInfo(
          failed.length
            ? `Emails sent: ${ok}, failed: ${failed.map(f => f.email).join(', ')}`
            : `Emails sent: ${ok}`
        );
      }

      if (!regRes.ok) throw new Error(regJson?.message || 'Registration failed');

      // 2) Token
      let token =
        (typeof regJson?.token === 'string' && regJson.token.trim()) ||
        (typeof regJson?.data?.token === 'string' && regJson.data.token.trim()) ||
        null;


      if (!token) {
        // For user self-signup, backend emails a temp password.
        if (role === 'user') {
          setInfo('Account created. A temporary password has been sent to your email. Please check your inbox (and spam).');
          // Optionally reset the form right away (won’t clear the info message)
          resetForm();
          // Show the message first, then take them to Login
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: { fromSignup: true, flash: 'We emailed you a temporary password.' }
            });
          }, 4500);
          return;
        }
        // Non-user flows without token: just send to Login without the password message
        localStorage.removeItem('token');
        navigate('/login', { replace: true, state: { fromSignup: true } });
        return;
      }


      // 3) Profile (pre-assign)
      dbg('PROFILE (pre) → /api/user/profile');
      const me1 = await fetch(apiUrl('/api/user/profile'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me1Json = await me1.json().catch(() => ({}));
      dbg('PROFILE (pre) status ←', me1.status, me1.statusText, me1Json);
      if (!me1.ok) throw new Error(me1Json?.message || 'Failed to fetch profile (pre-assign)');

      // 4) Save devices to current user (if any)
      if (deviceIdsOnly.length) {
        const body = { deviceIds: deviceIdsOnly };
        dbg('SAVE DEVICES → /api/user/devices/save', body);
        const r = await fetch(apiUrl('/api/user/devices/save'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const j = await r.json().catch(() => ({}));
        dbg('SAVE DEVICES status ←', r.status, r.statusText, j);

        if (!r.ok || j.status === 'partial') {
          console.warn('[Signup] Device save partial/fail', j);
          setInfo('Account created. Some devices could not be linked; support will complete it.');
        }
      }

      // 5) Re-fetch profile
      dbg('PROFILE (post) → /api/user/profile');
      const me2 = await fetch(apiUrl('/api/user/profile'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me2Json = await me2.json().catch(() => ({}));
      dbg('PROFILE (post) status ←', me2.status, me2.statusText, me2Json);

      // 6) Finalize
      setInfo('Registered successfully.');
      dbg('Registered (non-user) ✓');
      resetForm();
    } catch (err) {
      console.error('[Signup] handleSignup error:', err);
      setError(err?.message || 'Something went wrong');
    } finally {
      console.timeEnd('[Signup] total');
      console.groupEnd();
      setLoading(false);
    }

    function resetForm() {
      setRoleNotice('');
      setRole('user');
      setFirstName('');
      setLastName('');
      setOrgName('');
      setEmail('');
      setCountryCode('+91');
      setMobile('');
      setCountry('India');
      setPincode('');
      setHouse('');
      setStreet('');
      setCity('');
      // weight profile
      setHeight('');
      setHeightUnit('cm');
      setWeight('');
      setWeightUnit('kg');
      setWaist('');
      setWaistUnit('cm');
      setDob('');
      setAge('');
      setGender('');
      setPassword('');
      setConfirmPassword('');

      // devices + grid + preview
      setDeviceIdInput('');
      setAllotToInput('');
      setDevices([]);
      setGridX(3);
      setGridY(2);
      setSeriesIndex(0);
      setDisplayIds(new Set());
      setDeviceDecode(null);
      setDeviceCheckMsg('');
      setDeviceServer(null);

      // superadmin block
      setCompanyName('');
      setCompanyEmail('');
      setCompanyPhoneCC('+91');
      setCompanyPhone('');
      setCompanyCountry('India');
      setCompanyPincode('');
      setCompanyCity('');
      setCompanyAddress('');
      setSendInfoTo('');
      setUsersToAdd([]);
      setAddedUserIds([]);
    }
  };

  const effectiveRole = role || 'user'; // guards against any transient falsy state
  const showAllotSelect = effectiveRole === 'admin' || effectiveRole === 'superadmin';

  const handleGoogleSignup = () => {
    window.location.href = apiUrl('/api/auth/google');
  };


  const getProfileForDevice = (deviceId) => {
    const found = profiles.find(p => p.deviceIds.includes(normalizeDeviceIdFull(deviceId)));
    return found ? found.name : '';
  };


  return (
    <div className="signup-container">
      <div className="auth-card-signup">
        <h1 className="app-title">
          <span className="logo-gradient">Dozemate</span>
        </h1>

        <form onSubmit={handleSignup} className="signup-form">
          {/* Role selector */}
          <div className="input-container">
            <FiUser className="input-icon" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-input"
              aria-label="Select role"
              disabled={devices.length > 1} // auto-admin rule
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {/* Names */}
          <div className="row-2">
            <div className="input-container">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="input-container">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Last name (optional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="input-container">
            <FiUser className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="input-container">
            <FiUser className="input-icon" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Org dropdown */}
          <div className="input-container select">
            <FiGrid className="input-icon" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="text-input"
            >
              <option value="">Select Organization (optional)</option>
              {organizations.map(org => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.organizationId})
                </option>
              ))}
            </select>
          </div>

          {/* Mail id */}
          <div className="input-container">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="Mail id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Country code + Mobile */}
          <div className="phone-row">
            <div className="input-container select">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Country code"
              >
                <option value="+91">+91 India</option>
                <option value="+1">+1 United States</option>
                <option value="+44">+44 United Kingdom</option>
                <option value="+61">+61 Australia</option>
                <option value="+81">+81 Japan</option>
                <option value="+971">+971 UAE</option>
              </select>
            </div>
            <div className="input-container">
              <FiPhone className="input-icon" />
              <input
                type="tel"
                placeholder="Mobile number ( leading 0s will be removed)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                onBlur={handleMobileBlur}
                required
              />
            </div>
          </div>

          {/* Country (auto) */}
          <div className="input-container">
            <FiMapPin className="input-icon" />
            <input
              type="text"
              placeholder="Country (auto fill on phone code above)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {/* Pincode + City */}
          <div className="row-2">
            <div className="input-container">
              <FiMapPin className="input-icon" />
              <input
                type="text"
                placeholder="Pincode (mandatory)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                onBlur={handlePincodeBlur}
                required
              />
            </div>
            <div className="input-container">
              <FiMapPin className="input-icon" />
              <input
                type="text"
                placeholder="City (auto on pincode, editable)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>


          {/* Address */}
          <div className="input-container">
            <FiHome className="input-icon" />
            <input
              type="text"
              placeholder="House / Building (optional)"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
            />
          </div>
          <div className="input-container">
            <FiHome className="input-icon" />
            <input
              type="text"
              placeholder="Street (optional)"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          {/* Optional data for weight profile (User/Admin only) */}
          {role === 'user' && (
            <>
              <div className="section-title" style={{ marginTop: 8 }}>
                Optional data for weight profile
              </div>

              {/* --- Row 1: Height | Weight | Waist --- */}
              <div className="row-3-eq">
                {/* Height */}
                <div className="stacked-field">
                  <div className="field-label">Height</div>
                  <div className="combo-input">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={height}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || (!v.startsWith('-') && !Number.isNaN(Number(v)))) {
                          setHeight(v);
                        }
                      }}
                      onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                      placeholder="0"
                    />
                    <div className="unit-select-wrap">
                      <select
                        value={heightUnit}
                        onChange={(e) => setHeightUnit(e.target.value)}
                        aria-label="Height unit"
                      >
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                      </select>
                      <span className="unit-chevron">⌄</span>
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className="stacked-field">
                  <div className="field-label">Weight</div>
                  <div className="combo-input">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={weight}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || (!v.startsWith('-') && !Number.isNaN(Number(v)))) {
                          setWeight(v);
                        }
                      }}
                      onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                      placeholder="0"
                    />
                    <div className="unit-select-wrap">
                      <select
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value)}
                        aria-label="Weight unit"
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lbs</option>
                      </select>
                      <span className="unit-chevron">⌄</span>
                    </div>
                  </div>
                </div>

                {/* Waist */}
                <div className="stacked-field">
                  <div className="field-label">Waist</div>
                  <div className="combo-input">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={waist}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || (!v.startsWith('-') && !Number.isNaN(Number(v)))) {
                          setWaist(v);
                        }
                      }}
                      onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                      placeholder="0"
                    />
                    <div className="unit-select-wrap">
                      <select
                        value={waistUnit}
                        onChange={(e) => setWaistUnit(e.target.value)}
                        aria-label="Waist unit"
                      >
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                      </select>
                      <span className="unit-chevron">⌄</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Row 2: DOB | Age | Gender --- */}
              <div className="row-3-eq">
                <div className="stacked-field">
                  <div className="field-label">DOB</div>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="date-input-like"
                  />
                </div>

                <div className="stacked-field">
                  <div className="field-label">Age (years)</div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={age}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || (!v.startsWith('-') && /^\d*$/.test(v))) {
                        setAge(v);
                      }
                    }}
                    onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                    placeholder="Age (years)"
                  />
                </div>

                <div className="stacked-field">
                  <div className="field-label">Gender</div>
                  <div className="input-container select" style={{ marginBottom: 0 }}>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="text-input"
                    >
                      <option value="">Select</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="undisclosed">Undisclosed</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
          {/* End of weight profile */}

          {role === 'admin' && (
            <>
              <div className="section-title" style={{ marginTop: 14 }}>
                {isEditing ? "Edit User" : "Add User"}
              </div>

              {/* Identifier */}
              <div className="input-container">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Identifier (e.g., Bed no 1) — To Be Unique"
                  value={auIdentifier}
                  onChange={(e) => setAuIdentifier(e.target.value)}
                />
              </div>

              {/* First / Last */}
              <div className="row-2">
                <div className="input-container">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="First name"
                    value={auFirst}
                    onChange={(e) => setAuFirst(e.target.value)}
                  />
                </div>
                <div className="input-container">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Last name (optional)"
                    value={auLast}
                    onChange={(e) => setAuLast(e.target.value)}
                  />
                </div>
              </div>

              {/* Mail */}
              <div className="input-container">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Mail id"
                  value={auEmail}
                  onChange={(e) => setAuEmail(e.target.value)}
                />
              </div>

              {/* Country code + Mobile */}
              <div className="phone-row">
                <div className="input-container select">
                  <select value={auCC} onChange={(e) => setAuCC(e.target.value)} aria-label="Country code">
                    <option value="+91">+91 India</option>
                    <option value="+1">+1 United States</option>
                    <option value="+44">+44 United Kingdom</option>
                    <option value="+61">+61 Australia</option>
                    <option value="+81">+81 Japan</option>
                    <option value="+971">+971 UAE</option>
                  </select>
                </div>
                <div className="input-container">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Mobile number (optional)"
                    value={auMobile}
                    onChange={(e) => setAuMobile(e.target.value)}
                  />
                </div>
              </div>

              {/* Country (auto) */}
              <div className="input-container">
                <FiMapPin className="input-icon" />
                <input
                  type="text"
                  placeholder="Country (auto fill on phone code)"
                  value={auCountry}
                  onChange={(e) => setAuCountry(e.target.value)}
                />
              </div>

              {/* Pincode + City */}
              <div className="row-2">
                <div className="input-container">
                  <FiMapPin className="input-icon" />
                  <input
                    type="text"
                    placeholder="Pin code (optional)"
                    value={auPincode}
                    onChange={(e) => setAuPincode(e.target.value)}
                    onBlur={handleAuPinBlur}
                  />
                </div>
                <div className="input-container">
                  <FiMapPin className="input-icon" />
                  <input
                    type="text"
                    placeholder="City (auto fill on pin code)"
                    value={auCity}
                    onChange={(e) => setAuCity(e.target.value)}
                  />
                </div>
              </div>

              {/* Address: House/Street */}
              <div className="input-container">
                <FiHome className="input-icon" />
                <input
                  type="text"
                  placeholder="House / Building (optional)"
                  value={auHouse}
                  onChange={(e) => setAuHouse(e.target.value)}
                />
              </div>
              <div className="input-container">
                <FiHome className="input-icon" />
                <input
                  type="text"
                  placeholder="Street (optional)"
                  value={auStreet}
                  onChange={(e) => setAuStreet(e.target.value)}
                />
              </div>

              {/* OKAY + note (exactly like sheet) */}
              <div className="personal-ok-row">

                <button
                  type="button"
                  className="btn-simple"
                  onClick={handleAddUserOkay}
                  disabled={addUserLoading}
                >
                  {addUserLoading ? 'Saving…' : (isEditing ? 'Save User' : 'Add User')}
                </button>

              </div>



              {profiles.length > 0 && (
                <div className="muted" style={{ marginTop: 6 }}>
                  Profiles: {profiles.map(p => `${p.name} (${p.deviceIds.length})`).join(', ')}
                </div>
              )}

              {/* (Optional) small inline list so you can see who’s queued */}
              {usersToAdd.length > 0 && (
                <div className="muted" style={{ marginTop: 4 }}>
                  User Added: {usersToAdd.map(u => u.firstName || u.email).join(', ')}
                </div>
              )}

            </>
          )}

          {/* Device Details (User/Admin) */}
          {(role === 'user' || role === 'admin') && (
            <>
              <div className="section-title">Device Details</div>

              <div className="row-2">
                <div className="input-container">
                  <FiGrid className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter Device ID (e.g., 0102-ACDE48112233)"
                    value={deviceIdInput}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().trim();
                      setDeviceIdInput(e.target.value);

                      const dec = decodeDeviceIdParts(val, codes);
                      if (dec.ok) {
                        setDeviceDecode(dec);
                        setDeviceCheckMsg("Format OK");
                        setShowDeviceDetails(true);
                        (async () => {
                          const { ok, device, exists } = await checkDeviceAvailability(val);
                          if (ok && exists) {
                            setDeviceServer(device);
                          } else {
                            setDeviceServer(null);
                          }
                        })();
                      } else {
                        setDeviceDecode(null);
                        setDeviceCheckMsg('');
                        setShowDeviceDetails(false);
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  title="Scan device (QR/Barcode)"
                  onClick={() => alert('Scanner placeholder – integrate react-qr-reader or similar')}
                >
                  <FiCamera style={{ marginRight: 6 }} /> Scan device
                </button>
              </div>

              {/* ✅ only preview + add button hide/show */}
              {showDeviceDetails && (
                <>
                  {showAllotSelect && (
                    <AsyncUserSelect
                      value={allotToInput}
                      onChange={setAllotToInput}
                      placeholder="Allot device to (User)"
                    />
                  )}

                  {showDeviceDetails && (
                    <DeviceIdPreview
                      decode={deviceDecode}
                      statusMsg={deviceCheckMsg}
                      device={deviceServer}
                    />
                  )}

                  {profiles.length > 0 && (
                    <div className="input-container select">
                      <select
                        value={selectedProfile}
                        onChange={(e) => setSelectedProfile(e.target.value)}
                        className="text-input"
                      >
                        <option value="">Select Profile (optional)</option>
                        {profiles.map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={addDevice}
                    disabled={!codes}
                  >
                    <FiPlus style={{ marginRight: 6 }} /> Add device
                  </button>
                </>
              )}
            </>
          )}


          {/* 🔹 View User section (replaces the "User Added:" line) */}
          {role === 'admin' && usersToAdd.length > 0 && devices.length > 0 && (

            <div className="section-block" style={{ marginTop: 18 }}>
              <div className="section-title">View User</div>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Device</th>
                    <th>Edit</th>
                    <th>Delete</th>
                    <th>Active</th>
                    <th>Display</th>
                  </tr>
                </thead>
                <tbody>
                  {usersToAdd.map((u, idx) => {
                    const d = devices[idx];
                    return (
                      <tr key={idx}>
                        <td>{u.email}</td>
                        <td>{d?.id || '—'}</td>
                        <td>
                          {/* Real edit action */}
                          <button
                            type="button"
                            onClick={() => {
                              console.log("[Signup] Edit user clicked", u, idx);
                              setEditUserIndex(idx);
                              setIsEditing(true);

                              // populate form fields
                              setAuIdentifier(u.identifier || '');
                              const nameParts =
                                u.firstName && u.lastName
                                  ? [u.firstName, u.lastName]
                                  : (u.name?.split(' ') || []);

                              setAuFirst(u.firstName || nameParts[0] || '');
                              setAuLast(u.lastName || nameParts[1] || '');
                              setAuEmail(u.email || '');
                              setAuCC(u.countryCode || '+91');
                              setAuMobile(u.mobile || '');
                              setAuCountry(u.country || 'India');
                              setAuPincode(u.pincode || '');
                              setAuHouse(u.address?.split(',')[0] || '');
                              setAuStreet(u.address?.split(',')[1] || '');
                              setAuCity(u.city || '');
                            }}
                          >
                            Edit
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setUsersToAdd(prev => prev.filter((_, i) => i !== idx));
                              setDevices(prev => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            Delete
                          </button>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!d?.active}
                            onChange={() => {
                              setDevices(prev => {
                                const next = [...prev];
                                next[idx] = { ...d, active: !d?.active };
                                return next;
                              });
                            }}
                          />{" "}
                          {d?.active ? "Active" : "Non-Active"}
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={d ? displayIds.has(d.id) : false}
                            disabled={!d?.active}
                            onChange={() => toggleDisplay(d.id, d?.active)}
                          />{" "}
                          {d?.active ? "Display" : "Not Display"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          )}

          {/* Super Admin extras */}
          {role === 'superadmin' && (
            <>
              <div className="section-title" style={{ marginTop: 16 }}>
                Add Company (optional)
              </div>

              <div className="input-container">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="input-container">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Mail id"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>

              <div className="phone-row">
                <div className="input-container select">
                  <select
                    value={companyPhoneCC}
                    onChange={(e) => setCompanyPhoneCC(e.target.value)}
                    aria-label="Country code"
                  >
                    <option value="+91">+91 India</option>
                    <option value="+1">+1 United States</option>
                    <option value="+44">+44 United Kingdom</option>
                    <option value="+61">+61 Australia</option>
                    <option value="+81">+81 Japan</option>
                    <option value="+971">+971 UAE</option>
                  </select>
                </div>
                <div className="input-container">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-container">
                <FiMapPin className="input-icon" />
                <input
                  type="text"
                  placeholder="Country (auto fill on location)"
                  value={companyCountry}
                  onChange={(e) => setCompanyCountry(e.target.value)}
                />
              </div>

              <div className="row-2">
                <div className="input-container">
                  <FiMapPin className="input-icon" />
                  <input
                    type="text"
                    placeholder="Pin code (optional)"
                    value={companyPincode}
                    onChange={(e) => setCompanyPincode(e.target.value)}
                    onBlur={handleCompanyPincodeBlur}
                  />
                </div>
                <div className="input-container">
                  <FiMapPin className="input-icon" />
                  <input
                    type="text"
                    placeholder="City (auto fill on pin code)"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-container">
                <FiHome className="input-icon" />
                <input
                  type="text"
                  placeholder="Address (optional)"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>

              <div className="section-title" style={{ marginTop: 10 }}>Send information to</div>
              <div className="input-container">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Send information to (email)"
                  value={sendInfoTo}
                  onChange={(e) => setSendInfoTo(e.target.value)}
                />
              </div>

              {/* Optional device allotment */}
              <div className="section-title">Device Details (optional)</div>
              <div className="row-3">
                <div className="input-container">
                  <FiGrid className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter Device ID (optional)"
                    value={deviceIdInput}
                    onChange={(e) => setDeviceIdInput(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  title="Scan device (QR/Barcode)"
                  onClick={() => alert('Scanner placeholder – integrate react-qr-reader or similar')}
                >
                  <FiCamera style={{ marginRight: 6 }} /> Scan device
                </button>

                <AsyncUserSelect
                  value={allotToInput}
                  onChange={setAllotToInput}
                  placeholder="Allot device to (User) (search email/name)"
                />
              </div>

              <button type="button" className="btn-outline" onClick={addDevice}>
                <FiPlus style={{ marginRight: 6 }} /> OKAY
              </button>
            </>
          )}

          {info && <div className="info-message">{info}</div>}
          {roleNotice && <div className="info-message muted">{roleNotice}</div>}
          {error && <div className="error-message shake">{error}</div>}

          <button type="submit" className="signup-button hover-effect" disabled={loading}>
            {loading ? <span className="loading-spinner" /> : <span className="button-text">Create Account</span>}
          </button>

          <p className="login-link">
            Already have an account?{' '}
            <Link to="/login" className="link-gradient">
              Login
            </Link>
          </p>
          <div className="oauth-buttons">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="oauth-btn google"
            >
              <FcGoogle style={{ marginRight: 8 }} /> Continue with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
