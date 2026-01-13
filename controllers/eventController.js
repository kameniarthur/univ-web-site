const Event = require('../models/Event');

class EventController {
    async createEvent(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const { title, description, event_date, location, category, image_url } = req.body;

            if (!title || !event_date || !location) {
                return res.status(400).json({ error: 'Champs obligatoires manquants' });
            }

            const newEvent = await Event.create({
                title,
                description,
                event_date,
                location,
                category,
                image_url
            });

            res.status(201).json({
                message: 'Événement créé avec succès',
                eventId: newEvent.id,
                data: newEvent
            });
        } catch (error) {
            console.error('Erreur création événement:', error);
            res.status(500).json({ error: 'Erreur serveur lors de la création de l\'événement' });
        }
    }

    async getAllEvents(req, res) {
        try {
            const { category, upcoming = 'true', limit = 100, offset = 0 } = req.query;

            const events = await Event.findAll({
                category,
                upcoming: upcoming === 'true',
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                events,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: events.length
                }
            });
        } catch (error) {
            console.error('Erreur récupération événements:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getUpcomingEvents(req, res) {
        try {
            const { days = 30 } = req.query;
            const events = await Event.findUpcoming(parseInt(days));

            res.json({
                events,
                count: events.length
            });
        } catch (error) {
            console.error('Erreur récupération événements à venir:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getEventById(req, res) {
        try {
            const eventId = req.params.id;
            const event = await Event.findById(eventId);

            if (!event) {
                return res.status(404).json({ error: 'Événement non trouvé' });
            }

            res.json(event);
        } catch (error) {
            console.error('Erreur récupération événement:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async updateEvent(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const eventId = req.params.id;
            const { title, description, event_date, location, category, image_url } = req.body;

            const updatedEvent = await Event.update(eventId, {
                title,
                description,
                event_date,
                location,
                category,
                image_url
            });

            res.json({
                message: 'Événement mis à jour avec succès',
                data: updatedEvent
            });
        } catch (error) {
            console.error('Erreur mise à jour événement:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async deleteEvent(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const eventId = req.params.id;
            const deletedEvent = await Event.delete(eventId);

            if (!deletedEvent) {
                return res.status(404).json({ error: 'Événement non trouvé' });
            }

            res.json({
                message: 'Événement supprimé avec succès',
                eventId: deletedEvent.id
            });
        } catch (error) {
            console.error('Erreur suppression événement:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getPastEvents(req, res) {
        try {
            const { limit = 50 } = req.query;
            const events = await Event.findPast(parseInt(limit));

            res.json({
                events,
                count: events.length
            });
        } catch (error) {
            console.error('Erreur récupération événements passés:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async searchEvents(req, res) {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Terme de recherche requis' });
            }

            const events = await Event.search(query);

            res.json({
                events,
                count: events.length
            });
        } catch (error) {
            console.error('Erreur recherche événements:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getEventsByDateRange(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({ error: 'Dates de début et de fin requises' });
            }

            const events = await Event.findByDateRange(start_date, end_date);

            res.json({
                events,
                count: events.length
            });
        } catch (error) {
            console.error('Erreur récupération événements par date:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    async getEventsStats(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
            }

            const [upcoming, past, byCategory] = await Promise.all([
                Event.findUpcoming(365),
                Event.findPast(1000),
                Event.countByCategory()
            ]);

            const stats = {
                total: upcoming.length + past.length,
                upcoming: upcoming.length,
                past: past.length,
                byCategory: {},
                byMonth: {}
            };

            const allEvents = [...upcoming, ...past];

            // Stats par catégorie
            byCategory.forEach(cat => {
                stats.byCategory[cat.category] = cat.count;
            });

            // Stats par mois
            allEvents.forEach(event => {
                const month = new Date(event.event_date).toISOString().slice(0, 7);
                stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
            });

            res.json(stats);
        } catch (error) {
            console.error('Erreur statistiques événements:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

module.exports = new EventController();