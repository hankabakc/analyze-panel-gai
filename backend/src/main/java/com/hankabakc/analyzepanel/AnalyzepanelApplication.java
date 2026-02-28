package com.hankabakc.analyzepanel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class AnalyzepanelApplication {

	public static void main(String[] args) {
		SpringApplication.run(AnalyzepanelApplication.class, args);
		System.out.println("\n\n#########################################");
		System.out.println("##                                     ##");
		System.out.println("##               BASLADI               ##");
		System.out.println("##                                     ##");
		System.out.println("#########################################\n\n");
	}

}
