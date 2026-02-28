package com.hankabakc.analyzepanel.core.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hankabakc.analyzepanel.auth.repository.AppUserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Collections;

/**
 * ApplicationConfig: Uygulama genelindeki temel Spring Security ve Web bean'lerini tanımlar.
 */
@Configuration
public class ApplicationConfig {

    private final AppUserRepository userRepository;

    public ApplicationConfig(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * objectMapper: JSON verilerini Java nesnelerine dönüştürmek için kullanılır.
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    /**
     * restClientBuilder: REST API çağrıları için yapılandırılmış modern HTTP istemcisi.
     * 240 saniyelik zaman aşımı (Timeout) eklenerek PDF analizi gibi uzun süren AI işlemleri desteklenmiştir.
     */
    @Bean
    public RestClient.Builder restClientBuilder() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofSeconds(240));
        
        return RestClient.builder().requestFactory(factory);
    }

    /**
     * UserDetailsService: Kullanıcı kimlik bilgilerini veritabanından yüklemek için kullanılır.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .map(user -> new User(
                        user.getEmail(),
                        user.getPassword(),
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                ))
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + username));
    }

    /**
     * authenticationProvider: Kimlik doğrulama mantığını (DAO tabanlı) yapılandırır.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * passwordEncoder: Şifreleri hashlemek için BCrypt algoritmasını sağlar.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * authenticationManager: Kimlik doğrulama sürecini yöneten Spring Bean'i.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
