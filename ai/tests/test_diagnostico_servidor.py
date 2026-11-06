"""Casos sintéticos de diagnóstico; no representan resultados de modelos."""

import subprocess
import unittest
from unittest.mock import patch

from ai.diagnostico_servidor import collect_report, nvidia_tool, parse_gpu_csv, run_command


class GpuCsvTest(unittest.TestCase):
    def test_multiple_devices_and_quoted_comma(self):
        data = '"GPU, prueba", 610.78, 8188\nGPU secundaria, 610.78, 4096\n'
        devices = parse_gpu_csv(data)
        self.assertEqual(len(devices), 2)
        self.assertEqual(devices[0]["name"], "GPU, prueba")
        self.assertEqual(devices[0]["memory_total_mib"], 8188)

    def test_unavailable_memory_is_unknown_not_zero(self):
        self.assertIsNone(parse_gpu_csv("GPU de prueba, 610.78, N/A")[0]["memory_total_mib"])

    def test_rejects_incomplete_or_invalid_memory(self):
        for text in ("GPU de prueba, 610.78", "GPU de prueba, 610.78, -1",
                     "GPU de prueba, 610.78, no-numero"):
            with self.subTest(text=text), self.assertRaises(ValueError):
                parse_gpu_csv(text)

    def test_empty_query_is_not_a_successful_gpu_report(self):
        with self.assertRaises(ValueError):
            parse_gpu_csv("\n")

    def test_unknown_driver_is_null(self):
        self.assertIsNone(parse_gpu_csv("GPU de prueba, N/A, N/A")[0]["driver_version"])


class CommandTest(unittest.TestCase):
    @patch("ai.diagnostico_servidor.shutil.which", return_value=None)
    @patch("ai.diagnostico_servidor.Path.is_file", return_value=True)
    @patch("ai.diagnostico_servidor.os.access", return_value=True)
    def test_wsl_tool_is_found_outside_path(self, _access, _file, _which):
        self.assertEqual(nvidia_tool(), "/usr/lib/wsl/lib/nvidia-smi")

    @patch("ai.diagnostico_servidor.subprocess.run", side_effect=FileNotFoundError)
    def test_missing_command_is_recorded(self, _run):
        result = run_command(["comando-inexistente"])
        self.assertEqual(result["returncode"], 127)
        self.assertIn("servicio no disponible", result["stderr"])

    @patch("ai.diagnostico_servidor.subprocess.run", side_effect=PermissionError)
    def test_permission_error_does_not_abort_report(self, _run):
        self.assertEqual(run_command(["nvidia-smi"])["returncode"], 126)

    @patch("ai.diagnostico_servidor.subprocess.run",
           side_effect=subprocess.TimeoutExpired("nvidia-smi", 10))
    def test_timeout_is_recorded(self, _run):
        self.assertEqual(run_command(["nvidia-smi"])["returncode"], 124)


class ReportTest(unittest.TestCase):
    @patch("ai.diagnostico_servidor.nvidia_tool", return_value=None)
    @patch("ai.diagnostico_servidor.run_command")
    def test_absent_gpu_does_not_report_empty_success(self, command, _tool):
        command.return_value = {"returncode": 127, "stdout": "", "stderr": "ausente"}
        report = collect_report()
        self.assertIsNone(report["gpu"]["devices"])
        self.assertIsNone(report["gpu"]["tool"])
        self.assertIn("version", report["python"])

    @patch("ai.diagnostico_servidor.nvidia_tool", return_value="/ruta/simulada/nvidia-smi")
    @patch("ai.diagnostico_servidor.run_command")
    def test_bad_gpu_output_preserves_diagnostic(self, command, _tool):
        command.return_value = {"returncode": 0, "stdout": "salida inesperada", "stderr": ""}
        report = collect_report()
        self.assertIsNone(report["gpu"]["devices"])
        self.assertIsNotNone(report["gpu"]["parse_error"])
