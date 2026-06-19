import React, { useContext, useState } from "react";
import {
    FiLock,
    FiMonitor,
    FiMoon,
    FiEye,
    FiEyeOff,
    FiSun,
    FiSmartphone,
} from "react-icons/fi";
import { FaDesktop } from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const Settings = () => {
    // No default tab → shows menu first on both mobile & desktop
    const [activeTab, setActiveTab] = useState(null);
    const { profileData, api,fetchSessions,sessions,timeAgo,setToken } = useContext(AuthContext)
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [preferences, setPreferences] = useState({
        twoFA: true,
        loginAlerts: false,
        newsletter: true,
        theme: "light",
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        next: false,
        confirm: false,
    });

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("/api/user/update-password", { oldPassword, newPassword })
            if (data.success) {
                toast.success("Password updated successfully");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setToken(""); // Automatically log out
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    const revokeAllSessions = async () => {
        try {
            const { data } = await api.post("/api/user/revoke-sessions");
            if (data.success) {
                toast.success(data.message);
                fetchSessions();
                setToken("")
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }
    const revokeSession = async (sessionId,isCurrent) => {
        try {
            const { data } = await api.delete(`/api/user/sessions/${sessionId}`);
            if (data.success) {
                toast.success(data.message);
                fetchSessions();
                if(isCurrent)setToken("")
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.message);
        }
    }
    const getDeviceIcon = (device) => {
        const d = device.toLowerCase();
        if (d.includes("iphone") || d.includes("phone"))
            return <FiSmartphone className="w-5 h-5" />;
        if (d.includes("windows") || d.includes("pc"))
            return <FaDesktop className="w-5 h-5" />;
        return <FiMonitor className="w-5 h-5" />;
    };

    const tabs = [
        {
            key: "password",
            label: "Password & Security",
            description: "Keep your account locked down",
            icon: <FiLock size={20} />,
            color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800",
        },
        {
            key: "sessions",
            label: "Active Sessions",
            description: "Manage logged-in devices",
            icon: <FiMonitor size={20} />,
            color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800",
        },
        {
            key: "theme",
            label: "Appearance",
            description: "Light / dark preferences",
            icon: <FiMoon size={20} />,
            color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800",
        },
    ];

    const togglePref = (key) => {
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const setTheme = (theme) => {
        setPreferences((prev) => ({ ...prev, theme }));
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const toggleShow = (key) => {
        setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full h-screen overflow-y-scroll font-sans p-4 sm:p-8 transition-colors duration-200 relative">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* HEADER */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
                                Manage security, device access, and how PingUp looks for you.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-800/50 border border-blue-100/50 dark:border-gray-700 rounded-xl py-3 px-4 shadow-sm hover:shadow-md transition-all duration-300">
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{sessions.length}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">
                                    Devices
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-700/50 dark:to-gray-800/50 border border-emerald-100/50 dark:border-gray-700 rounded-xl py-3 px-4 shadow-sm hover:shadow-md transition-all duration-300">
                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {preferences.twoFA ? "On" : "Off"}
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">
                                    2FA
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-gray-700/50 dark:to-gray-800/50 border border-purple-100/50 dark:border-gray-700 rounded-xl py-3 px-4 shadow-sm hover:shadow-md transition-all duration-300">
                                <p className="text-xl font-bold capitalize text-purple-600 dark:text-purple-400">
                                    {preferences.theme}
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">
                                    Theme
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* LEFT SIDE (MENU) */}
                    <aside className={`space-y-4 ${activeTab ? "hidden md:block" : ""}`}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-2 transition-colors duration-200">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl transition-all duration-300 border hover:-translate-y-0.5 hover:shadow-sm ${isActive
                                            ? "bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-blue-200 dark:border-blue-800/50 shadow-sm"
                                            : "border-transparent hover:bg-white dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        <div
                                            className={`w-11 h-11 rounded-lg flex items-center justify-center border ${tab.color}`}
                                        >
                                            {tab.icon}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {tab.label}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {tab.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* RIGHT SIDE (CONTENT) */}
                    <main className={`flex-1 ${!activeTab ? "hidden md:block" : ""}`} >
                        {/* Mobile back button */}
                        {activeTab && (
                            <button type="button" onClick={() => setActiveTab(null)} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 md:hidden transition-colors"
                            ><IoMdArrowRoundBack size={25} />
                                <span className="text-lg">Back</span>
                            </button>
                        )}

                        {/* Mobile placeholder when nothing selected */}
                        {!activeTab && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-10 text-center flex flex-col items-center justify-center md:hidden transition-all duration-300">
                                <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4 border border-blue-200 dark:border-gray-500 shadow-inner">
                                    <FiMonitor className="text-2xl text-blue-500 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Settings Overview</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">Select a category from the menu to manage your preferences.</p>
                            </div>
                        )}

                        {/* PASSWORD TAB */}
                        {activeTab === "password" && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors duration-200">
                                {/* Show alert ONLY if user has NO password (Google signup case) */}
                                {!profileData.hasPassword && (
                                    <div className="w-full py-2.5 rounded-lg font-medium text-sm text-white text-center bg-red-500">
                                        ⚠️ You signed in with Google and don't have a password yet. Set one now!
                                    </div>
                                )}
                                <form onSubmit={handleUpdatePassword} className="space-y-5">
                                    {/* PASSWORD HEADER */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                                                <FiLock /> Password & Security
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                                Create a strong password and keep your account secure.
                                            </p>
                                        </div>
                                    </div>
                                    {/* OLD PASSWORD only if exists */}
                                    {profileData.hasPassword && (
                                        <div className="space-y-1">
                                            <label className="text-sm text-slate-800 dark:text-gray-200">Current Password</label>
                                            <div className="relative">
                                                <input value={oldPassword}
                                                    type={showPassword.current ? "text" : "password"}
                                                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg text-sm pr-10 bg-transparent dark:text-gray-100 focus:outline-none"
                                                    placeholder="Enter Old password"
                                                    minLength={8}
                                                    required
                                                    onChange={(e) => setOldPassword(e.target.value)}
                                                />
                                                <button type="button"
                                                    onClick={() => toggleShow("current")}
                                                    className="absolute inset-y-0 right-2 flex items-center text-slate-500"
                                                >
                                                    {showPassword.current ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* NEW PASSWORD */}
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-800 dark:text-gray-200">New Password</label>
                                        <div className="relative">
                                            <input value={newPassword}
                                                type={showPassword.next ? "text" : "password"}
                                                className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg text-sm pr-10 bg-transparent dark:text-gray-100 focus:outline-none"
                                                placeholder="Enter new password"
                                                minLength={8}
                                                required
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <button type="button" onClick={() => toggleShow("next")} className="absolute inset-y-0 right-2 flex items-center text-slate-500" >
                                                {showPassword.next ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* CONFIRM PASSWORD */}
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-800 dark:text-gray-200">Confirm Password</label>
                                        <div className="relative">
                                            <input value={confirmPassword}
                                                type={showPassword.confirm ? "text" : "password"}
                                                className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg text-sm pr-10 bg-transparent dark:text-gray-100 focus:outline-none"
                                                placeholder="Re-enter new password"
                                                minLength={8}
                                                required
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShow("confirm")}
                                                className="absolute inset-y-0 right-2 flex items-center text-slate-500"
                                            >
                                                {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* SUBMIT BUTTON — Disabled until valid */}
                                    <button type="submit" disabled={!newPassword || !confirmPassword || (profileData.hasPassword && !oldPassword) || newPassword !== confirmPassword} className={`w-full py-3 rounded-lg font-semibold shadow-lg transition ${newPassword &&
                                        confirmPassword &&
                                        (!profileData.hasPassword || oldPassword) &&
                                        newPassword === confirmPassword
                                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                                        : "bg-gray-300 cursor-not-allowed text-gray-600"
                                        }`}
                                    >
                                        Update Password
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* SESSIONS TAB */}
                        {activeTab === "sessions" && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 transition-colors duration-200">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                                            <FiMonitor /> Active Sessions
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                            Sign out devices you no longer use.
                                        </p>
                                    </div>
                                    <button className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600">
                                        Refresh list
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {sessions.map((s) => (
                                        <div key={s.id} className="p-4 border border-slate-200 dark:border-gray-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-blue-200 dark:hover:border-blue-600 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center text-slate-700 dark:text-gray-200">
                                                    {getDeviceIcon(s.userAgent)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                                                        {s.deviceName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400">
                                                        {s.location} • IP {s.ip}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={"text-[11px] px-3 py-1 rounded-full border bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 border-slate-600 dark:border-gray-500"}>
                                                    {`Last seen • ${timeAgo(s.createdAt)}`}
                                                </span>
                                                <button onClick={()=>revokeSession(s.id,s.isCurrent)} className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition">
                                                    Revoke
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm rounded-full bg-red-50 hover:bg-red-100 px-2 py-1 border border-red-500 text-red-800">
                                    <button onClick={()=>revokeAllSessions()} className="font-semibold">Logout From All Devices</button>
                                </span>
                            </div>
                        )}

                        {/* THEME TAB */}
                        {activeTab === "theme" && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors duration-200">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                                            <FiMoon /> Appearance
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                            Choose how PingUp looks. Changes apply instantly to your
                                            account.
                                        </p>
                                    </div>
                                    <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-600">
                                        Preview only
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`border rounded-2xl p-4 text-left transition hover:border-blue-200 dark:hover:border-blue-600 ${preferences.theme === "light"
                                            ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30"
                                            : "border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FiSun className="text-amber-500" />
                                            <p className="font-semibold text-slate-900 dark:text-gray-100">Light</p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                            Bright cards, clean backgrounds.
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`border rounded-2xl p-4 text-left transition hover:border-blue-200 dark:hover:border-blue-600 ${preferences.theme === "dark"
                                            ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30"
                                            : "border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FiMoon className="text-indigo-500" />
                                            <p className="font-semibold text-slate-900 dark:text-gray-100">Dark</p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                            Dim surfaces, reduced glare.
                                        </p>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                Login alerts
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Get an email when a new device signs in.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => togglePref("loginAlerts")}
                                            className={`px-4 py-2 text-xs font-semibold rounded-full border transition ${preferences.loginAlerts
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-white text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            {preferences.loginAlerts ? "On" : "Off"}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                Product updates
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Receive monthly tips & release notes.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => togglePref("newsletter")}
                                            className={`px-4 py-2 text-xs font-semibold rounded-full border transition ${preferences.newsletter
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-white text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            {preferences.newsletter ? "Subscribed" : "Subscribe"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Settings;
