---
sidebar_position: 4
---

# Provider Security

Security is a critical aspect of the LocalBase Provider Node. This guide explains the security features of the provider node and how they protect your system from malicious workloads.

## Security Architecture

The provider node uses a multi-layered security approach to isolate workloads:

```
┌─────────────────────────────────────────────────────────────┐
│                        Provider Node                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Security Manager                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Sandbox                          │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Seccomp   │  │  AppArmor   │  │   Cgroups   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Network   │  │ Filesystem  │  │   Process   │  │    │
│  │  │  Isolation  │  │  Isolation  │  │  Isolation  │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │                  Job Execution               │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers

### Seccomp Filtering

Seccomp (Secure Computing Mode) is a Linux kernel feature that restricts the system calls that can be made by a process. The provider node uses seccomp to limit the system calls that jobs can make, preventing them from accessing sensitive system functionality.

Example seccomp profile:

```json
{
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
```

### AppArmor Profiles

AppArmor is a Linux security module that restricts programs' capabilities with per-program profiles. The provider node uses AppArmor to control what files and resources jobs can access.

Example AppArmor profile:

```
# AppArmor profile for LocalBase job
profile localbase-job {
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
  /var/lib/localbase/sandbox/** rwk,
  
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
}
```

### Cgroups

Control Groups (cgroups) are a Linux kernel feature that limits, accounts for, and isolates the resource usage of a collection of processes. The provider node uses cgroups to limit the resources that jobs can use.

Example cgroups configuration:

```json
{
  "memory": {
    "limit_in_bytes": 8589934592,  // 8GB
    "swappiness": 0
  },
  "cpu": {
    "shares": 1024,
    "cfs_period_us": 100000,
    "cfs_quota_us": 100000  // 1 CPU core
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
```

### Network Isolation

The provider node restricts network access for jobs, preventing them from accessing unauthorized resources. This is done using network namespaces and firewall rules.

Example network configuration:

```json
{
  "enabled": true,
  "allowed_hosts": ["api.openai.com", "huggingface.co"],
  "dns": ["8.8.8.8", "8.8.4.4"],
  "outbound_bandwidth": 1048576,  // 1MB/s
  "inbound_bandwidth": 1048576    // 1MB/s
}
```

### Filesystem Isolation

The provider node isolates the filesystem for each job, preventing jobs from accessing files outside their sandbox. This is done using mount namespaces and bind mounts.

Each job gets its own sandbox directory with the following structure:

```
/var/lib/localbase/sandbox/{job_id}/
├── input/
├── output/
├── models/
└── tmp/
```

### Process Isolation

The provider node isolates processes for each job, preventing jobs from interacting with other processes on the system. This is done using PID namespaces.

## Security Validation

The provider node includes several mechanisms to validate security:

### Model Validation

Before loading a model, the provider node validates it to ensure it doesn't contain malicious code:

- **File Size Check**: Ensures the model file is not too large
- **File Type Check**: Ensures the model file has an allowed extension
- **Content Scan**: Scans the model file for suspicious content

### Job Output Validation

After a job completes, the provider node validates its output to ensure it doesn't contain malicious content:

- **File Size Check**: Ensures the output file is not too large
- **Content Scan**: Scans the output file for suspicious content

### Runtime Monitoring

During job execution, the provider node monitors the job for suspicious behavior:

- **Resource Usage**: Monitors CPU, memory, and disk usage
- **Network Activity**: Monitors network connections
- **Process Activity**: Monitors process creation and termination

## Security Best Practices

To ensure the security of your provider node, follow these best practices:

1. **Keep the provider node updated**: Regularly update the provider node software to get the latest security patches.

2. **Use a dedicated machine**: Run the provider node on a dedicated machine to minimize the attack surface.

3. **Use a firewall**: Configure a firewall to restrict network access to the provider node.

4. **Use secure authentication**: Use strong passwords and API keys for authentication.

5. **Monitor logs**: Regularly review the provider node logs for suspicious activity.

6. **Backup configuration**: Regularly backup the provider node configuration.

7. **Use secure communication**: Use HTTPS for API communication.

8. **Limit user access**: Limit access to the provider node to authorized users only.

## Next Steps

To learn more about the provider node, check out the following guides:

- [Monitoring](monitoring.md): How to monitor the provider node
- [Scaling](scaling.md): How the provider node scales resources
- [Troubleshooting](troubleshooting.md): How to troubleshoot common issues
