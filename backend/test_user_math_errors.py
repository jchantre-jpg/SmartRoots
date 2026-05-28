"""Pruebas de validación de expresiones y coeficientes (Raíces vs Polinomios)."""
from __future__ import annotations

import unittest

from user_math_errors import (
    parse_coefficients_list,
    parse_roots_expression,
    require_float_field,
    roots_expression_error_message,
    validate_interpolation_nodes,
)


class TestParseRootsExpression(unittest.TestCase):
    def test_valid_simple(self):
        f, x = parse_roots_expression("x**2 - 2")
        self.assertIn(x, f.free_symbols)

    def test_valid_sqrt(self):
        f, _x = parse_roots_expression("sqrt(x) - 1")
        self.assertTrue(f.has(_x))

    def test_empty(self):
        with self.assertRaises(ValueError) as ctx:
            parse_roots_expression("   ")
        self.assertIn("Escribe", str(ctx.exception))

    def test_wrong_variable_y(self):
        with self.assertRaises(ValueError) as ctx:
            parse_roots_expression("y**2 - 1")
        self.assertIn("y", str(ctx.exception))

    def test_constant_only(self):
        with self.assertRaises(ValueError) as ctx:
            parse_roots_expression("42")
        self.assertIn("no depende", str(ctx.exception).lower())

    def test_constant_pi(self):
        with self.assertRaises(ValueError):
            parse_roots_expression("pi + 1")

    def test_coefficients_misplaced_in_roots(self):
        msg = roots_expression_error_message("1, 0, -2")
        self.assertIn("Polinomios", msg)
        with self.assertRaises(ValueError) as ctx:
            parse_roots_expression("1,0,-2")
        self.assertIn("coeficientes", str(ctx.exception).lower())


class TestParseCoefficientsList(unittest.TestCase):
    def test_list_ok(self):
        self.assertEqual(parse_coefficients_list([1, 0, -2.5]), [1.0, 0.0, -2.5])

    def test_string_ok(self):
        self.assertEqual(parse_coefficients_list("1; 0 , -2"), [1.0, 0.0, -2.0])

    def test_formula_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            parse_coefficients_list("x**2 + 1")
        self.assertIn("fórmula", str(ctx.exception).lower())

    def test_formula_element_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            parse_coefficients_list(["1", "x+1"])
        self.assertIn("fórmula", str(ctx.exception).lower())

    def test_not_list(self):
        with self.assertRaises(ValueError) as ctx:
            parse_coefficients_list(3.14)
        self.assertIn("lista", str(ctx.exception).lower())

    def test_empty_list(self):
        with self.assertRaises(ValueError):
            parse_coefficients_list([])

    def test_invalid_number_in_list(self):
        with self.assertRaises(ValueError) as ctx:
            parse_coefficients_list([1, "abc"])
        self.assertIn("posición", str(ctx.exception))


class TestInterpolationNodes(unittest.TestCase):
    def test_ok(self):
        xs, ys = validate_interpolation_nodes([0.0, 1.0], [1.0, 2.0])
        self.assertEqual(xs, [0.0, 1.0])
        self.assertEqual(ys, [1.0, 2.0])

    def test_length_mismatch(self):
        with self.assertRaises(ValueError) as ctx:
            validate_interpolation_nodes([0, 1], [1, 2, 3])
        self.assertIn("misma longitud", str(ctx.exception).lower())

    def test_duplicate_x(self):
        with self.assertRaises(ValueError) as ctx:
            validate_interpolation_nodes([0, 0, 1], [1, 2, 3])
        self.assertIn("distintos", str(ctx.exception).lower())

    def test_too_few(self):
        with self.assertRaises(ValueError):
            validate_interpolation_nodes([0], [1])


class TestRequireFloatField(unittest.TestCase):
    def test_missing(self):
        with self.assertRaises(ValueError) as ctx:
            require_float_field({}, "a", "a")
        self.assertIn("Falta", str(ctx.exception))

    def test_ok(self):
        self.assertEqual(require_float_field({"a": "1.5"}, "a", "a"), 1.5)


class TestFlaskApiValidation(unittest.TestCase):
    """Respuestas 400 con ``hints`` desde la app Flask."""

    @classmethod
    def setUpClass(cls):
        from app import app as flask_app

        cls.app = flask_app
        cls.app.testing = True

    def test_recommend_coefficients_misplaced(self):
        client = self.app.test_client()
        r = client.post("/api/recommend", json={"expression": "1,0,-2"})
        self.assertEqual(r.status_code, 400)
        data = r.get_json()
        self.assertIn("error", data)
        self.assertIsInstance(data.get("hints"), list)
        self.assertGreaterEqual(len(data["hints"]), 1)

    def test_sample_curve_bad_variable(self):
        client = self.app.test_client()
        r = client.post("/api/sample_curve", json={"expression": "t**2-1", "xmin": -1, "xmax": 1})
        self.assertEqual(r.status_code, 400)
        data = r.get_json()
        self.assertIn("t", data["error"])
        self.assertIsInstance(data.get("hints"), list)

    def test_poly_horner_formula_coeffs(self):
        client = self.app.test_client()
        r = client.post("/api/polynomial/horner", json={"coefficients": "x**2+1", "x": 1})
        self.assertEqual(r.status_code, 400)
        data = r.get_json()
        self.assertIn("fórmula", data["error"].lower())
        self.assertIsInstance(data.get("hints"), list)

    def test_solve_missing_interval(self):
        client = self.app.test_client()
        r = client.post(
            "/api/solve",
            json={"method": "bisection", "expression": "x**2 - 2"},
        )
        self.assertEqual(r.status_code, 400)
        data = r.get_json()
        self.assertIn("error", data)
        self.assertIn("a", data["error"].lower())
        self.assertIsInstance(data.get("hints"), list)
        self.assertNotIn("trace", data)

    def test_interp_duplicate_x(self):
        client = self.app.test_client()
        r = client.post(
            "/api/interpolation/lagrange",
            json={"x_nodes": [0, 0, 1], "y_nodes": [1, 2, 3], "x": 0.5},
        )
        self.assertEqual(r.status_code, 400)
        data = r.get_json()
        self.assertIn("distintos", data["error"].lower())
        self.assertIsInstance(data.get("hints"), list)


if __name__ == "__main__":
    unittest.main()
