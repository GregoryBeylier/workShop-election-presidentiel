package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Bulletin;
import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Repository.BulletinRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class BulletinService {

    private final BulletinRepository bulletinRepository;

    public BulletinService(BulletinRepository bulletinRepository) {
        this.bulletinRepository = bulletinRepository;
    }

    public List<Bulletin> findAll() {
        return bulletinRepository.findAll();
    }

    public Optional<Bulletin> findById(Long id) {
        return bulletinRepository.findById(id);
    }

    public Optional<Bulletin> findByInscription(Inscription inscription) {
        return bulletinRepository.findByInscription(inscription);
    }

    public Bulletin create(Inscription inscription) {
        if (bulletinRepository.existsByInscription(inscription)) {
            throw new IllegalArgumentException("Un bulletin a déjà été déposé pour cette inscription.");
        }
        Bulletin bulletin = new Bulletin(null, inscription, LocalDate.now());
        return bulletinRepository.save(bulletin);
    }

    public void delete(Long id) {
        if (!bulletinRepository.existsById(id)) {
            throw new IllegalArgumentException("Bulletin introuvable avec l'id : " + id);
        }
        bulletinRepository.deleteById(id);
    }
}