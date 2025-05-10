"""
Security Manager for LocalBase Provider Node
"""

import os
import json
import logging
import hashlib
import time
import subprocess
import shutil
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class SecurityManager:
    """
    Manages security for the provider node
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the security manager
        
        Args:
            config: Security configuration
        """
        self.config = config
        self.sandbox_dir = config.get("sandbox_dir", "/tmp/localbase/sandbox")
        self.enable_seccomp = config.get("enable_seccomp", True)
        self.enable_apparmor = config.get("enable_apparmor", True)
        self.enable_cgroups = config.get("enable_cgroups", True)
        self.enable_network_isolation = config.get("enable_network_isolation", True)
        self.allowed_hosts = config.get("allowed_hosts", [])
        self.max_file_size = config.get("max_file_size", 1024 * 1024 * 100)  # 100MB
        self.allowed_file_types = config.get("allowed_file_types", [".py", ".txt", ".json", ".onnx", ".bin", ".safetensors"])
        self.scan_models = config.get("scan_models", True)
        self.runtime_monitoring = config.get("runtime_monitoring", True)
        
        # Create sandbox directory if it doesn't exist
        os.makedirs(self.sandbox_dir, exist_ok=True)
        
        logger.info("Security Manager initialized")
    
    def validate_model(self, model_path: str) -> Dict[str, Any]:
        """
        Validate a model file for security
        
        Args:
            model_path: Path to the model file
            
        Returns:
            Validation results
        """
        logger.info(f"Validating model: {model_path}")
        
        results = {
            "valid": True,
            "issues": [],
            "file_size": 0,
            "file_type": "",
            "hash": "",
        }
        
        try:
            # Check if file exists
            if not os.path.exists(model_path):
                results["valid"] = False
                results["issues"].append("File does not exist")
                return results
            
            # Check file size
            file_size = os.path.getsize(model_path)
            results["file_size"] = file_size
            
            if file_size > self.max_file_size:
                results["valid"] = False
                results["issues"].append(f"File size exceeds maximum allowed: {file_size} > {self.max_file_size}")
            
            # Check file type
            file_ext = os.path.splitext(model_path)[1].lower()
            results["file_type"] = file_ext
            
            if file_ext not in self.allowed_file_types:
                results["valid"] = False
                results["issues"].append(f"File type not allowed: {file_ext}")
            
            # Calculate file hash
            with open(model_path, "rb") as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
                results["hash"] = file_hash
            
            # Scan model if enabled
            if self.scan_models and file_ext in [".py", ".txt"]:
                scan_results = self._scan_model_content(model_path)
                if not scan_results["valid"]:
                    results["valid"] = False
                    results["issues"].extend(scan_results["issues"])
            
            logger.info(f"Model validation results: {results}")
            
        except Exception as e:
            logger.error(f"Error validating model: {e}")
            results["valid"] = False
            results["issues"].append(f"Validation error: {str(e)}")
        
        return results
    
    def _scan_model_content(self, model_path: str) -> Dict[str, Any]:
        """
        Scan model content for security issues
        
        Args:
            model_path: Path to the model file
            
        Returns:
            Scan results
        """
        results = {
            "valid": True,
            "issues": []
        }
        
        try:
            # Check for suspicious imports in Python files
            if model_path.endswith(".py"):
                with open(model_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                suspicious_imports = [
                    "os.system", "subprocess", "eval(", "exec(", 
                    "import socket", "import requests", "urllib", 
                    "__import__", "open(", "file(", "shutil"
                ]
                
                for imp in suspicious_imports:
                    if imp in content:
                        results["valid"] = False
                        results["issues"].append(f"Suspicious code detected: {imp}")
            
            # Check for malicious content in text files
            if model_path.endswith(".txt"):
                with open(model_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Check for shell commands
                if "#!/bin/bash" in content or "#!/bin/sh" in content:
                    results["valid"] = False
                    results["issues"].append("Shell script detected in text file")
                
                # Check for base64 encoded content
                if "base64" in content and any(x in content for x in ["decode", "exec", "eval"]):
                    results["valid"] = False
                    results["issues"].append("Potential encoded malicious content detected")
        
        except Exception as e:
            logger.error(f"Error scanning model content: {e}")
            results["valid"] = False
            results["issues"].append(f"Scan error: {str(e)}")
        
        return results
    
    def create_secure_environment(self, job_id: str) -> Dict[str, Any]:
        """
        Create a secure environment for job execution
        
        Args:
            job_id: Job ID
            
        Returns:
            Environment information
        """
        logger.info(f"Creating secure environment for job {job_id}")
        
        env_info = {
            "job_id": job_id,
            "sandbox_path": os.path.join(self.sandbox_dir, job_id),
            "created_at": time.time(),
            "valid": True,
            "issues": []
        }
        
        try:
            # Create sandbox directory for the job
            sandbox_path = env_info["sandbox_path"]
            os.makedirs(sandbox_path, exist_ok=True)
            
            # Create subdirectories
            os.makedirs(os.path.join(sandbox_path, "input"), exist_ok=True)
            os.makedirs(os.path.join(sandbox_path, "output"), exist_ok=True)
            os.makedirs(os.path.join(sandbox_path, "models"), exist_ok=True)
            os.makedirs(os.path.join(sandbox_path, "tmp"), exist_ok=True)
            
            # Set permissions
            os.chmod(sandbox_path, 0o755)
            
            # Create security profile
            if self.enable_seccomp:
                self._create_seccomp_profile(job_id, sandbox_path)
            
            if self.enable_apparmor:
                self._create_apparmor_profile(job_id, sandbox_path)
            
            if self.enable_cgroups:
                self._create_cgroups_config(job_id, sandbox_path)
            
            if self.enable_network_isolation:
                self._create_network_config(job_id, sandbox_path)
            
            logger.info(f"Secure environment created for job {job_id}")
            
        except Exception as e:
            logger.error(f"Error creating secure environment: {e}")
            env_info["valid"] = False
            env_info["issues"].append(f"Environment creation error: {str(e)}")
        
        return env_info
    
    def _create_seccomp_profile(self, job_id: str, sandbox_path: str):
        """
        Create seccomp profile for the job
        
        Args:
            job_id: Job ID
            sandbox_path: Sandbox path
        """
        seccomp_profile = {
            "defaultAction": "SCMP_ACT_ERRNO",
            "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_AARCH64"],
            "syscalls": [
                {
                    "names": [
                        "read", "write", "open", "close", "stat", "fstat", "lstat",
                        "poll", "lseek", "mmap", "mprotect", "munmap", "brk",
                        "rt_sigaction", "rt_sigprocmask", "rt_sigreturn", "ioctl",
                        "pread64", "pwrite64", "readv", "writev", "access", "pipe",
                        "select", "sched_yield", "mremap", "msync", "mincore",
                        "madvise", "shmget", "shmat", "shmctl", "dup", "dup2",
                        "pause", "nanosleep", "getitimer", "alarm", "setitimer",
                        "getpid", "sendfile", "socket", "connect", "accept",
                        "sendto", "recvfrom", "sendmsg", "recvmsg", "shutdown",
                        "bind", "listen", "getsockname", "getpeername", "socketpair",
                        "setsockopt", "getsockopt", "clone", "fork", "vfork",
                        "execve", "exit", "wait4", "kill", "uname", "fcntl",
                        "flock", "fsync", "fdatasync", "truncate", "ftruncate",
                        "getdents", "getcwd", "chdir", "fchdir", "rename", "mkdir",
                        "rmdir", "creat", "link", "unlink", "symlink", "readlink",
                        "chmod", "fchmod", "chown", "fchown", "lchown", "umask",
                        "gettimeofday", "getrlimit", "getrusage", "sysinfo",
                        "times", "ptrace", "getuid", "syslog", "getgid", "setuid",
                        "setgid", "geteuid", "getegid", "setpgid", "getppid",
                        "getpgrp", "setsid", "setreuid", "setregid", "getgroups",
                        "setgroups", "setresuid", "getresuid", "setresgid",
                        "getresgid", "getpgid", "setfsuid", "setfsgid", "getsid",
                        "capget", "capset", "rt_sigpending", "rt_sigtimedwait",
                        "rt_sigqueueinfo", "rt_sigsuspend", "sigaltstack",
                        "utime", "mknod", "uselib", "personality", "ustat",
                        "statfs", "fstatfs", "sysfs", "getpriority", "setpriority",
                        "sched_setparam", "sched_getparam", "sched_setscheduler",
                        "sched_getscheduler", "sched_get_priority_max",
                        "sched_get_priority_min", "sched_rr_get_interval",
                        "mlock", "munlock", "mlockall", "munlockall", "vhangup",
                        "modify_ldt", "pivot_root", "_sysctl", "prctl", "arch_prctl",
                        "adjtimex", "setrlimit", "chroot", "sync", "acct",
                        "settimeofday", "mount", "umount2", "swapon", "swapoff",
                        "reboot", "sethostname", "setdomainname", "iopl",
                        "ioperm", "create_module", "init_module", "delete_module",
                        "get_kernel_syms", "query_module", "quotactl", "nfsservctl",
                        "getpmsg", "putpmsg", "afs_syscall", "tuxcall", "security",
                        "gettid", "readahead", "setxattr", "lsetxattr", "fsetxattr",
                        "getxattr", "lgetxattr", "fgetxattr", "listxattr",
                        "llistxattr", "flistxattr", "removexattr", "lremovexattr",
                        "fremovexattr", "tkill", "time", "futex", "sched_setaffinity",
                        "sched_getaffinity", "set_thread_area", "io_setup",
                        "io_destroy", "io_getevents", "io_submit", "io_cancel",
                        "get_thread_area", "lookup_dcookie", "epoll_create",
                        "epoll_ctl_old", "epoll_wait_old", "remap_file_pages",
                        "getdents64", "set_tid_address", "restart_syscall",
                        "semtimedop", "fadvise64", "timer_create", "timer_settime",
                        "timer_gettime", "timer_getoverrun", "timer_delete",
                        "clock_settime", "clock_gettime", "clock_getres",
                        "clock_nanosleep", "exit_group", "epoll_wait", "epoll_ctl",
                        "tgkill", "utimes", "vserver", "mbind", "set_mempolicy",
                        "get_mempolicy", "mq_open", "mq_unlink", "mq_timedsend",
                        "mq_timedreceive", "mq_notify", "mq_getsetattr",
                        "kexec_load", "waitid", "add_key", "request_key",
                        "keyctl", "ioprio_set", "ioprio_get", "inotify_init",
                        "inotify_add_watch", "inotify_rm_watch", "migrate_pages",
                        "openat", "mkdirat", "mknodat", "fchownat", "futimesat",
                        "newfstatat", "unlinkat", "renameat", "linkat", "symlinkat",
                        "readlinkat", "fchmodat", "faccessat", "pselect6",
                        "ppoll", "unshare", "set_robust_list", "get_robust_list",
                        "splice", "tee", "sync_file_range", "vmsplice", "move_pages",
                        "utimensat", "epoll_pwait", "signalfd", "timerfd_create",
                        "eventfd", "fallocate", "timerfd_settime", "timerfd_gettime",
                        "accept4", "signalfd4", "eventfd2", "epoll_create1",
                        "dup3", "pipe2", "inotify_init1", "preadv", "pwritev",
                        "rt_tgsigqueueinfo", "perf_event_open", "recvmmsg",
                        "fanotify_init", "fanotify_mark", "prlimit64",
                        "name_to_handle_at", "open_by_handle_at", "clock_adjtime",
                        "syncfs", "sendmmsg", "setns", "getcpu", "process_vm_readv",
                        "process_vm_writev", "kcmp", "finit_module", "sched_setattr",
                        "sched_getattr", "renameat2", "seccomp", "getrandom",
                        "memfd_create", "kexec_file_load", "bpf", "execveat",
                        "userfaultfd", "membarrier", "mlock2", "copy_file_range",
                        "preadv2", "pwritev2", "pkey_mprotect", "pkey_alloc",
                        "pkey_free", "statx", "io_pgetevents", "rseq"
                    ],
                    "action": "SCMP_ACT_ALLOW"
                }
            ]
        }
        
        # Write seccomp profile to file
        seccomp_path = os.path.join(sandbox_path, "seccomp.json")
        with open(seccomp_path, "w") as f:
            json.dump(seccomp_profile, f, indent=2)
    
    def _create_apparmor_profile(self, job_id: str, sandbox_path: str):
        """
        Create AppArmor profile for the job
        
        Args:
            job_id: Job ID
            sandbox_path: Sandbox path
        """
        apparmor_profile = f"""
# AppArmor profile for LocalBase job {job_id}
profile localbase-{job_id} {{
  # Basic capabilities
  capability chown,
  capability dac_override,
  capability dac_read_search,
  capability fowner,
  capability fsetid,
  capability kill,
  capability setgid,
  capability setuid,
  capability setpcap,
  capability net_bind_service,
  capability net_admin,
  capability net_raw,
  capability sys_chroot,
  capability sys_ptrace,
  capability sys_admin,
  capability sys_boot,
  capability sys_nice,
  capability sys_resource,
  capability sys_time,
  capability sys_tty_config,
  capability mknod,
  capability audit_write,
  capability audit_control,
  
  # Allow access to sandbox directory
  {sandbox_path}/** rwk,
  
  # Allow read access to system files
  /usr/lib/** r,
  /lib/** r,
  /etc/passwd r,
  /etc/group r,
  /etc/nsswitch.conf r,
  /etc/resolv.conf r,
  /etc/localtime r,
  /etc/timezone r,
  /etc/hosts r,
  
  # Python specific
  /usr/bin/python* rix,
  /usr/local/bin/python* rix,
  
  # Deny access to sensitive files
  deny /etc/shadow r,
  deny /etc/gshadow r,
  deny /etc/ssh/** r,
  deny /root/** rwklx,
  deny /home/** rwklx,
  deny @{PROC}/** rwklx,
  
  # Network access
  network inet stream,
  network inet dgram,
  network inet6 stream,
  network inet6 dgram,
}}
"""
        
        # Write AppArmor profile to file
        apparmor_path = os.path.join(sandbox_path, "apparmor.profile")
        with open(apparmor_path, "w") as f:
            f.write(apparmor_profile)
    
    def _create_cgroups_config(self, job_id: str, sandbox_path: str):
        """
        Create cgroups configuration for the job
        
        Args:
            job_id: Job ID
            sandbox_path: Sandbox path
        """
        cgroups_config = {
            "memory": {
                "limit_in_bytes": self.config.get("memory_limit", 8 * 1024 * 1024 * 1024),  # 8GB
                "swappiness": 0
            },
            "cpu": {
                "shares": self.config.get("cpu_shares", 1024),
                "cfs_period_us": 100000,
                "cfs_quota_us": self.config.get("cpu_quota", 100000)  # 1 CPU core
            },
            "blkio": {
                "weight": 500,
                "throttle.read_bps_device": [],
                "throttle.write_bps_device": []
            },
            "devices": {
                "allow": "a",
                "deny": []
            }
        }
        
        # Write cgroups configuration to file
        cgroups_path = os.path.join(sandbox_path, "cgroups.json")
        with open(cgroups_path, "w") as f:
            json.dump(cgroups_config, f, indent=2)
    
    def _create_network_config(self, job_id: str, sandbox_path: str):
        """
        Create network configuration for the job
        
        Args:
            job_id: Job ID
            sandbox_path: Sandbox path
        """
        network_config = {
            "enabled": self.enable_network_isolation,
            "allowed_hosts": self.allowed_hosts,
            "dns": ["8.8.8.8", "8.8.4.4"],
            "outbound_bandwidth": self.config.get("outbound_bandwidth", 1024 * 1024),  # 1MB/s
            "inbound_bandwidth": self.config.get("inbound_bandwidth", 1024 * 1024)  # 1MB/s
        }
        
        # Write network configuration to file
        network_path = os.path.join(sandbox_path, "network.json")
        with open(network_path, "w") as f:
            json.dump(network_config, f, indent=2)
    
    def cleanup_environment(self, job_id: str) -> bool:
        """
        Clean up the secure environment for a job
        
        Args:
            job_id: Job ID
            
        Returns:
            Success flag
        """
        logger.info(f"Cleaning up secure environment for job {job_id}")
        
        try:
            # Get sandbox path
            sandbox_path = os.path.join(self.sandbox_dir, job_id)
            
            # Check if sandbox exists
            if not os.path.exists(sandbox_path):
                logger.warning(f"Sandbox for job {job_id} not found")
                return True
            
            # Remove sandbox directory
            shutil.rmtree(sandbox_path, ignore_errors=True)
            
            logger.info(f"Secure environment cleaned up for job {job_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error cleaning up secure environment: {e}")
            return False
    
    def scan_job_output(self, job_id: str, output_path: str) -> Dict[str, Any]:
        """
        Scan job output for security issues
        
        Args:
            job_id: Job ID
            output_path: Path to the output file
            
        Returns:
            Scan results
        """
        logger.info(f"Scanning output for job {job_id}: {output_path}")
        
        results = {
            "valid": True,
            "issues": [],
            "file_size": 0,
            "file_type": "",
            "hash": ""
        }
        
        try:
            # Check if file exists
            if not os.path.exists(output_path):
                results["valid"] = False
                results["issues"].append("Output file does not exist")
                return results
            
            # Check file size
            file_size = os.path.getsize(output_path)
            results["file_size"] = file_size
            
            if file_size > self.max_file_size:
                results["valid"] = False
                results["issues"].append(f"Output file size exceeds maximum allowed: {file_size} > {self.max_file_size}")
            
            # Check file type
            file_ext = os.path.splitext(output_path)[1].lower()
            results["file_type"] = file_ext
            
            # Calculate file hash
            with open(output_path, "rb") as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
                results["hash"] = file_hash
            
            # Scan output content
            if file_ext in [".txt", ".json"]:
                with open(output_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Check for suspicious content
                suspicious_patterns = [
                    "#!/bin/", "eval(", "exec(", "os.system", "subprocess",
                    "import os", "import sys", "import subprocess", "import socket",
                    "base64.decode", "__import__"
                ]
                
                for pattern in suspicious_patterns:
                    if pattern in content:
                        results["valid"] = False
                        results["issues"].append(f"Suspicious content detected: {pattern}")
            
            logger.info(f"Output scan results: {results}")
            
        except Exception as e:
            logger.error(f"Error scanning output: {e}")
            results["valid"] = False
            results["issues"].append(f"Scan error: {str(e)}")
        
        return results
    
    def monitor_job(self, job_id: str, pid: int) -> Dict[str, Any]:
        """
        Monitor a running job for security issues
        
        Args:
            job_id: Job ID
            pid: Process ID
            
        Returns:
            Monitoring results
        """
        if not self.runtime_monitoring:
            return {"valid": True, "issues": []}
        
        logger.info(f"Monitoring job {job_id} with PID {pid}")
        
        results = {
            "valid": True,
            "issues": [],
            "resource_usage": {}
        }
        
        try:
            # Check if process exists
            if not self._is_process_running(pid):
                results["valid"] = False
                results["issues"].append(f"Process with PID {pid} not found")
                return results
            
            # Get process resource usage
            resource_usage = self._get_process_resources(pid)
            results["resource_usage"] = resource_usage
            
            # Check for excessive resource usage
            if resource_usage.get("memory_percent", 0) > 90:
                results["valid"] = False
                results["issues"].append(f"Excessive memory usage: {resource_usage.get('memory_percent')}%")
            
            if resource_usage.get("cpu_percent", 0) > 90:
                results["valid"] = False
                results["issues"].append(f"Excessive CPU usage: {resource_usage.get('cpu_percent')}%")
            
            # Check for suspicious network connections
            if self.enable_network_isolation:
                network_connections = self._get_process_connections(pid)
                
                for conn in network_connections:
                    remote_addr = conn.get("remote_address")
                    
                    if remote_addr and remote_addr not in self.allowed_hosts:
                        results["valid"] = False
                        results["issues"].append(f"Unauthorized network connection to {remote_addr}")
            
            logger.info(f"Job monitoring results: {results}")
            
        except Exception as e:
            logger.error(f"Error monitoring job: {e}")
            results["valid"] = False
            results["issues"].append(f"Monitoring error: {str(e)}")
        
        return results
    
    def _is_process_running(self, pid: int) -> bool:
        """
        Check if a process is running
        
        Args:
            pid: Process ID
            
        Returns:
            True if process is running, False otherwise
        """
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False
    
    def _get_process_resources(self, pid: int) -> Dict[str, Any]:
        """
        Get process resource usage
        
        Args:
            pid: Process ID
            
        Returns:
            Resource usage information
        """
        try:
            import psutil
            
            process = psutil.Process(pid)
            
            # Get resource usage
            with process.oneshot():
                cpu_percent = process.cpu_percent(interval=1)
                memory_info = process.memory_info()
                memory_percent = process.memory_percent()
                io_counters = process.io_counters() if hasattr(process, 'io_counters') else None
                num_threads = process.num_threads()
                
                return {
                    "cpu_percent": cpu_percent,
                    "memory_rss": memory_info.rss,
                    "memory_vms": memory_info.vms,
                    "memory_percent": memory_percent,
                    "io_read_bytes": io_counters.read_bytes if io_counters else 0,
                    "io_write_bytes": io_counters.write_bytes if io_counters else 0,
                    "num_threads": num_threads
                }
                
        except Exception as e:
            logger.error(f"Error getting process resources: {e}")
            return {}
    
    def _get_process_connections(self, pid: int) -> List[Dict[str, Any]]:
        """
        Get process network connections
        
        Args:
            pid: Process ID
            
        Returns:
            List of network connections
        """
        try:
            import psutil
            
            process = psutil.Process(pid)
            
            # Get network connections
            connections = []
            
            for conn in process.connections():
                if conn.status == 'ESTABLISHED':
                    connections.append({
                        "local_address": f"{conn.laddr.ip}:{conn.laddr.port}" if hasattr(conn, 'laddr') else None,
                        "remote_address": f"{conn.raddr.ip}:{conn.raddr.port}" if hasattr(conn, 'raddr') else None,
                        "status": conn.status,
                        "type": conn.type
                    })
            
            return connections
            
        except Exception as e:
            logger.error(f"Error getting process connections: {e}")
            return []
