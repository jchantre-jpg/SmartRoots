import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { passwordRuleChecks, validateLoginForm, validateRegisterForm } from '../lib/authValidation';
import { ErrorText, PrimaryButton, SecondaryButton } from './ui';

export function AuthModal({ visible, onClose }) {
  const { colors } = useTheme();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [reg, setReg] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setError('');
    setFieldErrors({});
    setBusy(false);
  }, [visible, mode]);

  async function onSubmit() {
    setError('');
    setFieldErrors({});
    if (mode === 'login') {
      const v = validateLoginForm({ username: loginUser, password: loginPassword });
      if (!v.ok) {
        setFieldErrors(v.errors);
        return;
      }
      setBusy(true);
      try {
        await login(loginUser.trim(), loginPassword);
        onClose();
        setLoginPassword('');
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const v = validateRegisterForm(reg);
    if (!v.ok) {
      setFieldErrors(v.errors);
      return;
    }
    setBusy(true);
    try {
      await register({
        fullName: reg.fullName.trim(),
        email: reg.email.trim(),
        username: reg.username.trim(),
        password: reg.password,
        passwordConfirm: reg.passwordConfirm,
      });
      onClose();
      setReg({ fullName: '', email: '', username: '', password: '', passwordConfirm: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const rules = passwordRuleChecks(reg.password);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,8,18,0.88)', justifyContent: 'center', padding: 20 }}>
        <View style={{ maxHeight: '90%', borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 18 }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>Cuenta local · misma API que la web</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: mode === 'login' ? colors.primary : colors.primaryDim, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setMode('login')}
              >
                <Text style={{ color: mode === 'login' ? '#0f172a' : colors.text, fontWeight: '600' }}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: mode === 'register' ? colors.primary : colors.primaryDim, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setMode('register')}
              >
                <Text style={{ color: mode === 'register' ? '#0f172a' : colors.text, fontWeight: '600' }}>Registro</Text>
              </TouchableOpacity>
            </View>

            {mode === 'login' ? (
              <>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>Usuario</Text>
                <TextInput
                  value={loginUser}
                  onChangeText={setLoginUser}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text, marginTop: 4 }}
                  autoCapitalize="none"
                />
                {fieldErrors.username ? <Text style={{ color: '#fecaca', fontSize: 12 }}>{fieldErrors.username}</Text> : null}
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Contraseña</Text>
                <TextInput
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text, marginTop: 4 }}
                  secureTextEntry={!showPass}
                />
                {fieldErrors.password ? <Text style={{ color: '#fecaca', fontSize: 12 }}>{fieldErrors.password}</Text> : null}
              </>
            ) : (
              <>
                {[
                  ['Nombre completo', 'fullName', reg.fullName, (t) => setReg((p) => ({ ...p, fullName: t }))],
                  ['Correo', 'email', reg.email, (t) => setReg((p) => ({ ...p, email: t }))],
                  ['Usuario', 'username', reg.username, (t) => setReg((p) => ({ ...p, username: t.toLowerCase() }))],
                ].map(([lbl, key, val, set]) => (
                  <View key={key}>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{lbl}</Text>
                    <TextInput value={val} onChangeText={set} style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text, marginTop: 4 }} autoCapitalize="none" />
                    {fieldErrors[key] ? <Text style={{ color: '#fecaca', fontSize: 12 }}>{fieldErrors[key]}</Text> : null}
                  </View>
                ))}
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Contraseña</Text>
                <TextInput
                  value={reg.password}
                  onChangeText={(t) => setReg((p) => ({ ...p, password: t }))}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text, marginTop: 4 }}
                  secureTextEntry={!showPass}
                />
                {fieldErrors.password ? <Text style={{ color: '#fecaca', fontSize: 12 }}>{fieldErrors.password}</Text> : null}
                {rules.map((r) => (
                  <Text key={r.id} style={{ color: r.ok ? '#86efac' : '#94a3b8', fontSize: 11, marginTop: 2 }}>
                    {r.ok ? '✓' : '○'} {r.label}
                  </Text>
                ))}
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Confirmar contraseña</Text>
                <TextInput
                  value={reg.passwordConfirm}
                  onChangeText={(t) => setReg((p) => ({ ...p, passwordConfirm: t }))}
                  style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text, marginTop: 4 }}
                  secureTextEntry={!showPass}
                />
                {fieldErrors.passwordConfirm ? (
                  <Text style={{ color: '#fecaca', fontSize: 12 }}>{fieldErrors.passwordConfirm}</Text>
                ) : null}
              </>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
              <Switch value={showPass} onValueChange={setShowPass} />
              <Text style={{ color: colors.muted, fontSize: 14 }}>Mostrar contraseña</Text>
            </View>

            <ErrorText message={error} />
            {busy ? <ActivityIndicator color="#5eead4" style={{ marginTop: 12 }} /> : null}

            <PrimaryButton label={busy ? 'Espera…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'} onPress={onSubmit} disabled={busy} />
            <SecondaryButton label="Cerrar" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
