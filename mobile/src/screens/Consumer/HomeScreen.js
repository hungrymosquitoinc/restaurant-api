import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPopular()
  }, [])

  const loadPopular = async () => {
    try {
      const data = await api.getMenu()
      const sorted = data.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      setPopular(sorted.slice(0, 4))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>NOW SERVING</Text>
          </View>
          <Text style={styles.heroTitle}>Great Food,{'\n'}No Waiting.</Text>
          <Text style={styles.heroSub}>
            Order your favorite dishes and enjoy a seamless dining experience.
          </Text>
          <TouchableOpacity style={styles.heroCta} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.heroCtaText}>Browse Our Menu</Text>
            <Text style={styles.heroCtaArrow}>→</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>120+</Text>
            <Text style={styles.heroStatLabel}>MENU ITEMS</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>4.8</Text>
            <Text style={styles.heroStatLabel}>AVG RATING</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>2k+</Text>
            <Text style={styles.heroStatLabel}>HAPPY CUSTOMERS</Text>
          </View>
        </View>
      </View>

      {/* Popular Dishes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Dishes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#d32f2f" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroll}>
            {popular.map(item => (
              <TouchableOpacity key={item.id} style={styles.popularCard} onPress={() => navigation.navigate('Menu')}>
                <View style={styles.popularImgWrap}>
                  <Image source={{ uri: item.image || 'https://placehold.co/200x200/f5f5f5/333?text=Food' }} style={styles.popularImg} />
                  <View style={styles.popularRating}>
                    <Text style={styles.popularRatingText}>★ {item.rating || '4.5'}</Text>
                  </View>
                </View>
                <View style={styles.popularInfo}>
                  <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.popularDesc} numberOfLines={2}>{item.description}</Text>
                  <Text style={styles.popularPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* How It Works */}
      <View style={[styles.section, styles.howSection]}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.steps}>
          {[
            { num: '1', icon: '📋', title: 'Browse Menu', desc: 'Explore our wide selection of dishes.' },
            { num: '2', icon: '🛒', title: 'Place Order', desc: 'Add items and checkout in seconds.' },
            { num: '3', icon: '🍽️', title: 'Enjoy', desc: 'Prepared fresh and served hot.' },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.num}</Text>
                </View>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
              {i < 2 && <View style={styles.stepConnector} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Why Choose Us */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <View style={styles.features}>
          {[
            { icon: '🌿', title: 'Fresh Ingredients', desc: 'Only the freshest local and imported ingredients.' },
            { icon: '⚡', title: 'Lightning Fast', desc: 'Real-time kitchen updates on your order.' },
            { icon: '🔒', title: 'Secure Payments', desc: 'Multiple payment options with bank-grade security.' },
          ].map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Eat?</Text>
        <Text style={styles.ctaSub}>Experience the best dining in town.</Text>
        <View style={styles.ctaBtns}>
          {user ? (
            <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.ctaBtnText}>Order Now</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.ctaBtnText}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaBtnOutline} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.ctaBtnOutlineText}>Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  sectionLink: { fontSize: 14, fontWeight: '600', color: '#d32f2f' },

  /* Hero */
  hero: {
    position: 'relative',
    padding: 32 20 24,
    backgroundColor: '#d32f2f',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    opacity: 0.08,
    backgroundColor: '#fff',
  },
  heroContent: { zIndex: 1 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#fff', lineHeight: 36, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22, marginBottom: 22, maxWidth: 280 },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 10, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  heroCtaText: { color: '#d32f2f', fontSize: 16, fontWeight: '700' },
  heroCtaArrow: { color: '#d32f2f', fontSize: 18, fontWeight: '700' },
  heroStats: {
    flexDirection: 'row', gap: 24, marginTop: 24, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroStat: {},
  heroStatValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginTop: 2 },

  /* Popular Dishes */
  popularScroll: { paddingRight: 16 },
  popularCard: {
    backgroundColor: '#fff', borderRadius: 14, marginRight: 14,
    width: 170, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  popularImgWrap: { position: 'relative', width: '100%', height: 140 },
  popularImg: { width: '100%', height: '100%' },
  popularRating: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  popularRatingText: { color: '#ffc107', fontSize: 11, fontWeight: '700' },
  popularInfo: { padding: 12 },
  popularName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 4 },
  popularDesc: { fontSize: 11, color: '#757575', lineHeight: 15, marginBottom: 8 },
  popularPrice: { fontSize: 16, fontWeight: '800', color: '#d32f2f' },

  /* How It Works */
  howSection: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  steps: { marginTop: 16 },
  step: { alignItems: 'center', paddingVertical: 14 },
  stepNumber: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#d32f2f', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  stepIcon: { fontSize: 28, marginBottom: 8 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#757575', textAlign: 'center', lineHeight: 18, maxWidth: 220 },
  stepConnector: { width: 2, height: 20, backgroundColor: '#e0e0e0', alignSelf: 'center' },

  /* Features */
  features: { gap: 12 },
  featureCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  featureIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#fce4ec', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: { fontSize: 24 },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#757575', textAlign: 'center', lineHeight: 18 },

  /* CTA */
  ctaSection: {
    backgroundColor: '#d32f2f', borderRadius: 14, marginHorizontal: 16,
    padding: 36 24, alignItems: 'center', marginBottom: 24,
  },
  ctaTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  ctaSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 24, textAlign: 'center' },
  ctaBtns: { width: '100%', gap: 10 },
  ctaBtn: {
    backgroundColor: '#fff', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#d32f2f', fontSize: 16, fontWeight: '700' },
  ctaBtnOutline: {
    borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  ctaBtnOutlineText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
