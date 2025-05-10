from setuptools import setup, find_packages

setup(
    name="localbase_tests",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pytest>=7.0.0",
        "requests>=2.25.0",
    ],
    python_requires=">=3.8",
)
