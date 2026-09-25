package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Model.Statistic;
import com.election_digital.demo.Repository.StatisticRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class StatisticService {

    private final StatisticRepository statisticRepository;

    public StatisticService(StatisticRepository statisticRepository) {
        this.statisticRepository = statisticRepository;
    }

    public List<Statistic> findAll() {
        return statisticRepository.findAll();
    }

    public Optional<Statistic> findById(Long id) {
        return statisticRepository.findById(id);
    }

    public List<Statistic> findByPeriode(PeriodeVote periode) {
        return statisticRepository.findByPeriode(periode);
    }

    public List<Statistic> findClassement(PeriodeVote periode) {
        return statisticRepository.findByPeriodeOrderByTotalPointsDesc(periode);
    }

    public Optional<Statistic> findByPeriodeAndCandidat(PeriodeVote periode, Candidat candidat) {
        return statisticRepository.findByPeriodeAndCandidat(periode, candidat);
    }

    public Statistic create(PeriodeVote periode, Candidat candidat) {
        if (statisticRepository.existsByPeriodeAndCandidat(periode, candidat)) {
            throw new IllegalArgumentException("Ce candidat a déjà des statistiques pour cette période.");
        }
        Statistic statistic = new Statistic(null, periode, candidat, BigDecimal.ZERO, 0, 0);
        return statisticRepository.save(statistic);
    }

    public Statistic ajouterVictoire(PeriodeVote periode, Candidat candidat, BigDecimal points) {
        Statistic statistic = statisticRepository.findByPeriodeAndCandidat(periode, candidat)
                .orElseGet(() -> create(periode, candidat));

        statistic.setNbVictoires(statistic.getNbVictoires() + 1);
        statistic.setTotalPoints(statistic.getTotalPoints().add(points));

        return statisticRepository.save(statistic);
    }

    public Statistic ajouterEgalite(PeriodeVote periode, Candidat candidat, BigDecimal points) {
        Statistic statistic = statisticRepository.findByPeriodeAndCandidat(periode, candidat)
                .orElseGet(() -> create(periode, candidat));

        statistic.setNbEgalites(statistic.getNbEgalites() + 1);
        statistic.setTotalPoints(statistic.getTotalPoints().add(points));

        return statisticRepository.save(statistic);
    }

    public void delete(Long id) {
        if (!statisticRepository.existsById(id)) {
            throw new IllegalArgumentException("Statistique introuvable avec l'id : " + id);
        }
        statisticRepository.deleteById(id);
    }
}