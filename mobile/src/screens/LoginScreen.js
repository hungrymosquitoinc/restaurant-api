import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter email and password')
    }
    setLoading(true)
    try {
      const res = await api.login(email.trim(), password.trim())
      login(res.user)
    } catch (e) {
      Alert.alert('Login Failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.brand}>Zpectrum Restobar</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="user@test.com"
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="password"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Demo Accounts:</Text>
            <Text style={styles.hint}>Customer: john@example.com / pass123</Text>
            <Text style={styles.hint}>Cook: cook@restaurant.com / cook123</Text>
            <Text style={styles.hint}>Admin: admin@restaurant.com / admin123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 32 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
    maxWidth: 400, width: '100%', alignSelf: 'center',
  },
  brand: { fontSize: 13, fontWeight: '800', color: '#d32f2f', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#212121', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 28 },
  form: {},
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#757575', marginBottom: 8 },
  input: {
    backgroundColor: '#fafafa', borderWidth: 2, borderColor: '#e0e0e0',
    borderRadius: 10, padding: 14, fontSize: 16, color: '#212121',
  },
  loginBtn: {
    backgroundColor: '#d32f2f', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hintBox: {
    marginTop: 20, padding: 14, backgroundColor: '#fff3e0',
    borderRadius: 10,
  },
  hintTitle: { fontSize: 13, fontWeight: '600', color: '#e65100', marginBottom: 6 },
  hint: { fontSize: 12, color: '#bf360c', marginBottom: 2 },
})
