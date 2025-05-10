from setuptools import setup, find_packages

setup(
    name="localbase-provider",
    version="0.1.0",
    description="LocalBase Provider Node",
    author="LocalBase Team",
    author_email="info@localbase.io",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.95.0",
        "uvicorn>=0.21.1",
        "pydantic>=1.10.7",
        "psutil>=5.9.5",
        "requests>=2.28.2",
        "cosmpy>=0.9.0",
        "python-multipart>=0.0.6",
    ],
    extras_require={
        "gpu": [
            "pynvml>=11.5.0",
            "pyamdgpuinfo>=23.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "localbase-provider=localbase_provider.__main__:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
)
