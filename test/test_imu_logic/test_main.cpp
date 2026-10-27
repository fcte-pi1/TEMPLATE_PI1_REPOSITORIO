#include <unity.h>
#include "imu_logic.h"

void setUp() {}
void tearDown() {}

void test_media_e_desvio_de_conjunto_conhecido() {
  EstatisticaGiro e;
  const float valores[] = {2.0f, 4.0f, 4.0f, 4.0f, 5.0f, 5.0f, 7.0f, 9.0f};
  for (float v : valores) e.adicionar(v);
  TEST_ASSERT_EQUAL_UINT32(8, e.amostras());
  TEST_ASSERT_FLOAT_WITHIN(1e-5f, 5.0f, e.media());
  TEST_ASSERT_FLOAT_WITHIN(1e-4f, 2.13809f, e.desvio()); // Desvio amostral
}

void test_sinal_constante_tem_desvio_zero() {
  EstatisticaGiro e;
  for (int i = 0; i < 800; i++) e.adicionar(-1.37f);
  TEST_ASSERT_FLOAT_WITHIN(1e-5f, -1.37f, e.media());
  TEST_ASSERT_FLOAT_WITHIN(1e-4f, 0.0f, e.desvio());
}

void test_sem_amostras_suficientes_nao_calibra() {
  EstatisticaGiro e;
  for (int i = 0; i < 100; i++) e.adicionar(0.5f);
  TEST_ASSERT_FALSE(calibracaoValida(e, 0.5f, 400));
}

void test_ruido_pequeno_em_torno_do_bias_calibra() {
  EstatisticaGiro e;
  for (int i = 0; i < 800; i++) e.adicionar(-1.2f + ((i % 2) ? 0.05f : -0.05f));
  TEST_ASSERT_TRUE(calibracaoValida(e, 0.5f, 400));
  TEST_ASSERT_FLOAT_WITHIN(0.01f, -1.2f, e.media());
}

void test_toque_no_robo_invalida_a_calibracao() {
  EstatisticaGiro e;
  for (int i = 0; i < 800; i++) {
    bool tocando = (i >= 400 && i < 440);
    e.adicionar(tocando ? 30.0f : -1.2f);
  }
  TEST_ASSERT_FALSE(calibracaoValida(e, 0.5f, 400));
}

void test_zona_morta_zera_abaixo_do_limite() {
  TEST_ASSERT_EQUAL_FLOAT(0.0f, aplicarZonaMorta(0.2f, 0.25f));
  TEST_ASSERT_EQUAL_FLOAT(0.0f, aplicarZonaMorta(-0.2f, 0.25f));
  TEST_ASSERT_EQUAL_FLOAT(0.0f, aplicarZonaMorta(0.0f, 0.25f));
}

void test_zona_morta_mantem_acima_do_limite() {
  TEST_ASSERT_EQUAL_FLOAT(0.3f, aplicarZonaMorta(0.3f, 0.25f));
  TEST_ASSERT_EQUAL_FLOAT(-0.3f, aplicarZonaMorta(-0.3f, 0.25f));
  TEST_ASSERT_EQUAL_FLOAT(90.0f, aplicarZonaMorta(90.0f, 0.25f));
}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_media_e_desvio_de_conjunto_conhecido);
  RUN_TEST(test_sinal_constante_tem_desvio_zero);
  RUN_TEST(test_sem_amostras_suficientes_nao_calibra);
  RUN_TEST(test_ruido_pequeno_em_torno_do_bias_calibra);
  RUN_TEST(test_toque_no_robo_invalida_a_calibracao);
  RUN_TEST(test_zona_morta_zera_abaixo_do_limite);
  RUN_TEST(test_zona_morta_mantem_acima_do_limite);
  return UNITY_END();
}
